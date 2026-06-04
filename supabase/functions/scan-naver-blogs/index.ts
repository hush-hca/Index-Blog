import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import * as cheerio from "npm:cheerio@1.0.0";

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

const supabaseUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SB_SERVICE_ROLE_KEY");
const libreTranslateUrl = Deno.env.get("LIBRETRANSLATE_URL") ?? "https://libretranslate.com";
const libreTranslateApiKey = Deno.env.get("LIBRETRANSLATE_API_KEY");

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SB_SERVICE_ROLE_KEY",
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => null) : null;

    if (body?.post_url) {
      const result = await processSubmittedPost({
        postUrl: String(body.post_url),
        userId: typeof body.user_id === "string" ? body.user_id : null,
      });

      return jsonResponse({
        ok: true,
        mode: "single_post",
        result,
      });
    }

    const blogs = await getActiveBlogs();
    const results: Awaited<ReturnType<typeof processBlog>>[] = [];

    for (const blog of blogs) {
      const blogResult = await processBlog(blog);
      results.push(blogResult);
    }

    return jsonResponse({
      ok: true,
      scannedBlogs: blogs.length,
      results,
    });
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

async function processSubmittedPost(input: { postUrl: string; userId: string | null }) {
  if (!input.userId) {
    throw new Error("Missing user_id for submitted post");
  }

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

  const detectedPost = await insertDetectedPostIfNew(blog.id, rssPost);

  if (!detectedPost) {
    return {
      postUrl: postParts.normalizedUrl,
      status: "ALREADY_PROCESSED",
    };
  }

  await processDetectedPost(detectedPost, rssPost);

  return {
    postUrl: postParts.normalizedUrl,
    status: "SUCCESS",
  };
}

async function getActiveBlogs(): Promise<RegisteredBlog[]> {
  const { data, error } = await supabase
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
  const cleanText = extractCleanTextFromHtml(rssPost.descriptionHtml);
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
  const { data: existing, error: selectError } = await supabase
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

  const { data, error } = await supabase
    .from("registered_blogs")
    .insert({
      user_id: input.userId,
      blog_url: `https://blog.naver.com/${input.blogId}`,
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
  const $ = cheerio.load(xml, { xmlMode: true });
  const posts: RssPost[] = [];

  $("item").each((_, item) => {
    const title = normalizeText($(item).find("title").first().text());
    const link = normalizeText($(item).find("link").first().text());
    const descriptionHtml = $(item).find("description").first().text();

    if (title && link && descriptionHtml) {
      posts.push({ title, link, descriptionHtml });
    }
  });

  return posts;
}

async function insertDetectedPostIfNew(
  blogId: string,
  rssPost: RssPost,
): Promise<DetectedPost | null> {
  const { data, error } = await supabase
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

function extractCleanTextFromHtml(html: string): string {
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe").remove();

  return normalizeText($("body").text() || $.text());
}

function extractNaverPostParts(input: string): NaverPostParts {
  const cleaned = input.trim().replace(/\/+$/, "");

  try {
    const url = new URL(cleaned);

    if (url.hostname !== "blog.naver.com") {
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
      normalizedUrl: `https://blog.naver.com/${blogId}/${logNo}`,
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
  const title = await translateTextToSpanish(input.koreanTitle);
  const translatedContent = await translateLongTextToSpanish(input.koreanContent.slice(0, 10000));
  const paragraphs = buildSpanishParagraphs(translatedContent);

  return {
    title,
    summaryHtml: paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n"),
    anchorText: "leer la publicacion original en Naver Blog",
  };
}

async function translateLongTextToSpanish(text: string) {
  const chunks = chunkText(text, 3500);
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    translatedChunks.push(await translateTextToSpanish(chunk));
  }

  return translatedChunks.join("\n\n");
}

async function translateTextToSpanish(text: string) {
  const endpoint = new URL("/translate", normalizeSiteUrl(libreTranslateUrl));
  const body: Record<string, string> = {
    q: text,
    source: "ko",
    target: "es",
    format: "text",
  };

  if (libreTranslateApiKey) {
    body.api_key = libreTranslateApiKey;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Spanish translation failed: ${response.status} ${
        data ? JSON.stringify(data) : response.statusText
      }`,
    );
  }

  if (!data?.translatedText) {
    throw new Error("Spanish translation response did not include translatedText");
  }

  return normalizeText(String(data.translatedText));
}

function chunkText(text: string, maxLength: number) {
  const paragraphs = text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => normalizeText(part))
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph;
      continue;
    }

    if (`${current}\n\n${paragraph}`.length > maxLength) {
      chunks.push(current);
      current = paragraph;
      continue;
    }

    current = `${current}\n\n${paragraph}`;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [text.slice(0, maxLength)];
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
  const { data, error } = await supabase.rpc("claim_next_wordpress_site");

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

  if (!body?.link) {
    throw new Error("WordPress response did not include a post link");
  }

  return body.link;
}

function buildWordpressContent(input: {
  summaryHtml: string;
  anchorText: string;
  originalUrl: string;
}) {
  return [
    sanitizeSummaryHtml(input.summaryHtml),
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
  const { error } = await supabase.from("backlink_logs").insert({
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
  const { error } = await supabase
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

function sanitizeSummaryHtml(html: string) {
  const $ = cheerio.load(html);

  $("script, style, iframe, object, embed, form").remove();
  $("a").each((_, element) => {
    $(element).removeAttr("href").removeAttr("target").removeAttr("rel");
  });

  return $("body").html()?.trim() || $.html().trim();
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
