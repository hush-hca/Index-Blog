import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type RegisteredBlog = {
  id: string;
  blog_url: string;
  blog_id: string;
};

type DetectedPost = {
  id: string;
  post_url: string;
  post_title: string | null;
};

type WordpressSite = {
  id: string;
  site_url: string;
  api_user: string;
  api_password: string;
};

type RssPost = {
  title: string;
  link: string;
  descriptionHtml: string;
};

type NaverPostParts = {
  blogId: string;
  logNo: string;
  normalizedUrl: string;
};

type TranslatedPost = {
  title: string;
  summaryHtml: string;
  anchorText: string;
};

type GoogleTranslateResponse = {
  data?: {
    translations?: Array<{
      translatedText?: string;
    }>;
  };
};

let supabaseClient: ReturnType<typeof createClient> | null = null;

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => null);

    if (body?.post_url) {
      const userId = await getAuthenticatedUserId(req);
      const result = await processSubmittedPost({
        postUrl: String(body.post_url),
        userId,
      });

      return jsonResponse({
        ok: true,
        mode: "single_post",
        result,
      });
    }

    return jsonResponse({ ok: false, error: "post_url is required" }, 400);
  } catch (error) {
    console.error(error);

    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

function getEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("SB_SERVICE_ROLE_KEY"),
    );
  }

  return supabaseClient;
}

async function getAuthenticatedUserId(req: Request) {
  const authorization = req.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Error("Missing Authorization bearer token");
  }

  const {
    data: { user },
    error,
  } = await getSupabase().auth.getUser(token);

  if (error || !user) {
    throw new Error("Invalid authenticated user");
  }

  return user.id;
}

async function processSubmittedPost(input: { postUrl: string; userId: string }) {
  const postParts = extractNaverPostParts(input.postUrl);
  const blog = await findOrCreateRegisteredBlog({
    userId: input.userId,
    blogId: postParts.blogId,
  });
  const rssPosts = await fetchNaverRssPosts(postParts.blogId);
  const rssPost = rssPosts.find((post) => {
    const candidate = extractNaverPostParts(post.link);
    return candidate.blogId === postParts.blogId && candidate.logNo === postParts.logNo;
  });

  if (!rssPost) {
    throw new Error("Submitted post was not found in the Naver Blog RSS feed");
  }

  const normalizedRssPost = {
    ...rssPost,
    link: postParts.normalizedUrl,
  };

  const detectedPost = await insertDetectedPostIfNew(blog.id, normalizedRssPost);

  if (!detectedPost) {
    const retryPost = await getRetryableDetectedPost(normalizedRssPost.link);

    if (retryPost) {
      await processDetectedPost(retryPost, normalizedRssPost);

      return {
        postUrl: postParts.normalizedUrl,
        status: "SUCCESS",
        retried: true,
      };
    }

    return {
      postUrl: postParts.normalizedUrl,
      status: "ALREADY_PROCESSED",
    };
  }

  await processDetectedPost(detectedPost, normalizedRssPost);

  return {
    postUrl: postParts.normalizedUrl,
    status: "SUCCESS",
  };
}

async function getActiveBlogs(): Promise<RegisteredBlog[]> {
  const { data, error } = await getSupabase()
    .from("registered_blogs")
    .select("id, blog_url, blog_id")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to load registered blogs: ${error.message}`);
  }

  return data ?? [];
}

async function processBlog(blog: RegisteredBlog) {
  const rssPosts = await fetchNaverRssPosts(blog.blog_id);
  const result = {
    blogId: blog.id,
    naverBlogId: blog.blog_id,
    rssPosts: rssPosts.length,
    newPosts: 0,
    backlinksInserted: 0,
    failures: [] as Array<{ postUrl: string; error: string }>,
  };

  for (const rssPost of rssPosts) {
    const detectedPost = await insertDetectedPostIfNew(blog.id, rssPost);

    if (!detectedPost) {
      continue;
    }

    result.newPosts += 1;

    try {
      await processDetectedPost(detectedPost, rssPost);
      result.backlinksInserted += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      result.failures.push({ postUrl: rssPost.link, error: message });

      await logBacklink({
        postId: detectedPost.id,
        wpSiteUrl: "",
        wpPostUrl: "",
        status: `FAILED: ${message}`.slice(0, 500),
      });
    }
  }

  return result;
}

async function processDetectedPost(detectedPost: DetectedPost, rssPost: RssPost) {
  const cleanText = truncatePlainText(extractCleanTextFromHtml(rssPost.descriptionHtml), 2000);
  const translatedPost = await translateNaverPostToSpanish({
    koreanTitle: rssPost.title,
    koreanContent: cleanText,
    originalUrl: rssPost.link,
  });
  const wordpressSite = await claimNextWordpressSite();
  const wpPostUrl = await publishWordpressPost({
    wordpressSite,
    translatedPost,
    originalUrl: rssPost.link,
  });

  await logBacklink({
    postId: detectedPost.id,
    wpSiteUrl: wordpressSite.site_url,
    wpPostUrl,
    status: "SUCCESS",
  });

  await markBacklinkInserted(detectedPost.id);
}

async function findOrCreateRegisteredBlog(input: {
  userId: string;
  blogId: string;
}): Promise<RegisteredBlog> {
  const { data: existing, error: selectError } = await getSupabase()
    .from("registered_blogs")
    .select("id, blog_url, blog_id")
    .eq("user_id", input.userId)
    .eq("blog_id", input.blogId)
    .eq("is_active", true)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Failed to find registered blog: ${selectError.message}`);
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await getSupabase()
    .from("registered_blogs")
    .insert({
      user_id: input.userId,
      blog_url: `https://m.blog.naver.com/${input.blogId}`,
      blog_id: input.blogId,
    })
    .select("id, blog_url, blog_id")
    .single();

  if (error) {
    throw new Error(`Failed to register blog for submitted post: ${error.message}`);
  }

  return data;
}

async function fetchNaverRssPosts(blogId: string): Promise<RssPost[]> {
  const rssUrl = `https://rss.blog.naver.com/${encodeURIComponent(blogId)}`;
  const response = await fetch(rssUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch RSS for ${blogId}: ${response.status} ${response.statusText}`,
    );
  }

  const xml = await response.text();
  const posts: RssPost[] = [];

  for (const itemXml of extractXmlBlocks(xml, "item")) {
    const title = normalizeText(decodeHtmlEntities(extractXmlTagText(itemXml, "title")));
    const link = normalizeText(decodeHtmlEntities(extractXmlTagText(itemXml, "link")));
    const descriptionHtml = decodeHtmlEntities(extractXmlTagText(itemXml, "description"));

    if (title && link && descriptionHtml) {
      posts.push({ title, link, descriptionHtml });
    }
  }

  return posts;
}

async function insertDetectedPostIfNew(
  blogId: string,
  rssPost: RssPost,
): Promise<DetectedPost | null> {
  const { data, error } = await getSupabase()
    .from("detected_posts")
    .insert({
      blog_id: blogId,
      post_url: rssPost.link,
      post_title: rssPost.title,
    })
    .select("id, post_url, post_title")
    .single();

  if (!error) {
    return data;
  }

  if (error.code === "23505") {
    return null;
  }

  throw new Error(`Failed to insert detected post: ${error.message}`);
}

async function getRetryableDetectedPost(postUrl: string): Promise<DetectedPost | null> {
  const { data, error } = await getSupabase()
    .from("detected_posts")
    .select("id, post_url, post_title")
    .eq("post_url", postUrl)
    .eq("backlink_inserted", false)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load retryable detected post: ${error.message}`);
  }

  return data;
}

function extractCleanTextFromHtml(html: string): string {
  return normalizeText(
    decodeHtmlEntities(
      html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, " ")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function extractXmlBlocks(xml: string, tagName: string) {
  const escapedTagName = escapeRegExp(tagName);
  const pattern = new RegExp(`<${escapedTagName}\\b[^>]*>([\\s\\S]*?)<\\/${escapedTagName}>`, "gi");
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(xml)) !== null) {
    blocks.push(match[1] ?? "");
  }

  return blocks;
}

function extractXmlTagText(xml: string, tagName: string) {
  const escapedTagName = escapeRegExp(tagName);
  const pattern = new RegExp(`<${escapedTagName}\\b[^>]*>([\\s\\S]*?)<\\/${escapedTagName}>`, "i");
  const match = pattern.exec(xml);

  if (!match?.[1]) {
    return "";
  }

  return match[1]
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractNaverPostParts(input: string): NaverPostParts {
  const cleaned = input.trim().replace(/\/+$/, "");

  try {
    const url = new URL(cleaned);

    if (url.hostname !== "blog.naver.com" && url.hostname !== "m.blog.naver.com") {
      throw new Error("Invalid Naver Blog URL");
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const blogId = url.searchParams.get("blogId") ?? pathParts[0];
    const logNo = url.searchParams.get("logNo") ?? pathParts[1];

    if (!blogId || !logNo) {
      throw new Error("Naver Blog post ID not found");
    }

    return {
      blogId,
      logNo,
      normalizedUrl: `https://m.blog.naver.com/${blogId}/${logNo}`,
    };
  } catch {
    throw new Error("Invalid Naver Blog post URL");
  }
}

async function translateNaverPostToSpanish(input: {
  koreanTitle: string;
  koreanContent: string;
  originalUrl: string;
}): Promise<TranslatedPost> {
  const [title, translatedContent] = await translateTextsToSpanish([
    input.koreanTitle,
    input.koreanContent,
  ]);
  const paragraphs = buildSpanishParagraphs(translatedContent);

  return {
    title,
    summaryHtml: paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n"),
    anchorText: "leer la publicacion original en Naver Blog",
  };
}

async function translateTextsToSpanish(texts: string[]) {
  const endpoint = new URL("https://translation.googleapis.com/language/translate/v2");
  endpoint.searchParams.set("key", getEnv("GOOGLE_TRANSLATE_API_KEY"));

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: texts,
      source: "ko",
      target: "es",
      format: "text",
    }),
  });

  const data = (await response.json().catch(() => null)) as GoogleTranslateResponse | null;

  if (!response.ok) {
    throw new Error(
      `Google Translation API failed: ${response.status} ${
        data ? JSON.stringify(data) : response.statusText
      }`,
    );
  }

  const translations = data?.data?.translations;

  if (!Array.isArray(translations) || translations.length !== texts.length) {
    throw new Error("Google Translation API response did not include all translations");
  }

  return translations.map((translation: { translatedText?: string }) =>
    normalizeText(String(translation.translatedText ?? ""))
  );
}

function truncatePlainText(text: string, maxLength: number) {
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function buildSpanishParagraphs(translatedContent: string) {
  const sentences = translatedContent
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeText(sentence))
    .filter(Boolean);

  if (sentences.length === 0) {
    return ["Resumen no disponible."];
  }

  const selected = sentences.slice(0, 8);
  const paragraphs: string[] = [];

  for (let index = 0; index < selected.length; index += 2) {
    paragraphs.push(selected.slice(index, index + 2).join(" "));
  }

  return paragraphs.slice(0, 4);
}

async function claimNextWordpressSite(): Promise<WordpressSite> {
  const { data, error } = await getSupabase().rpc("claim_next_wordpress_site");

  if (error) {
    throw new Error(`Failed to claim WordPress site: ${error.message}`);
  }

  if (!data) {
    throw new Error("No active WordPress site available");
  }

  return data as WordpressSite;
}

async function publishWordpressPost(input: {
  wordpressSite: WordpressSite;
  translatedPost: TranslatedPost;
  originalUrl: string;
}): Promise<string> {
  const endpoint = new URL("/wp-json/wp/v2/posts", normalizeSiteUrl(input.wordpressSite.site_url));
  const content = buildWordpressContent({
    summaryHtml: input.translatedPost.summaryHtml,
    anchorText: input.translatedPost.anchorText,
    originalUrl: input.originalUrl,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${input.wordpressSite.api_user}:${input.wordpressSite.api_password}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.translatedPost.title,
      content,
      status: "publish",
      categories: [1],
      tags: [],
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `WordPress publish failed for ${input.wordpressSite.site_url}: ${response.status} ${
        body ? JSON.stringify(body) : response.statusText
      }`,
    );
  }

  const postUrl = extractWordpressPostUrl(body, input.wordpressSite.site_url);

  if (!postUrl) {
    throw new Error(
      `WordPress response did not include a usable post URL: ${JSON.stringify(body)}`,
    );
  }

  return postUrl;
}

function extractWordpressPostUrl(body: unknown, siteUrl: string) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const post = body as {
    id?: number;
    link?: string;
    guid?: {
      rendered?: string;
    };
  };

  if (post.link) {
    return post.link;
  }

  if (post.guid?.rendered) {
    return post.guid.rendered;
  }

  if (post.id) {
    return new URL(`/?p=${post.id}`, normalizeSiteUrl(siteUrl)).toString();
  }

  return null;
}

function buildWordpressContent(input: {
  summaryHtml: string;
  anchorText: string;
  originalUrl: string;
}) {
  return [
    input.summaryHtml,
    "",
    `<p>Lee la publicacion original de Naver Blog aqui: <a href="${escapeHtml(input.originalUrl)}" rel="dofollow">${escapeHtml(input.anchorText)}</a></p>`,
  ].join("\n").trim();
}

async function logBacklink(input: {
  postId: string;
  wpSiteUrl: string;
  wpPostUrl: string;
  status: string;
}) {
  const { error } = await getSupabase().from("backlink_logs").insert({
    post_id: input.postId,
    wp_site_url: input.wpSiteUrl,
    wp_post_url: input.wpPostUrl,
    status: input.status,
  });

  if (error) {
    console.error(`Failed to write backlink log: ${error.message}`);
  }
}

async function markBacklinkInserted(postId: string) {
  const { error } = await getSupabase()
    .from("detected_posts")
    .update({ backlink_inserted: true })
    .eq("id", postId);

  if (error) {
    throw new Error(`Failed to mark backlink inserted: ${error.message}`);
  }
}

function normalizeSiteUrl(siteUrl: string) {
  const trimmed = siteUrl.trim();
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity: string) => {
    const normalized = entity.toLowerCase();

    if (normalized.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    }

    if (normalized.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    }

    return namedEntities[normalized] ?? `&${entity};`;
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
