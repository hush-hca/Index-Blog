"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractNaverPost } from "@/lib/naver/extractNaverPost";

type SubmitPostResult = {
  ok: boolean;
  requiresAuth?: boolean;
  error?: string;
};

export async function submitNaverPost(formData: FormData): Promise<SubmitPostResult> {
  const postUrl = String(formData.get("post_url") ?? "");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, requiresAuth: true };
  }

  let normalizedUrl: string;

  try {
    normalizedUrl = extractNaverPost(postUrl).normalizedUrl;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid Naver Blog post URL",
    };
  }

  const { data, error } = await supabase.functions.invoke("scan-naver-blogs", {
    body: {
      post_url: normalizedUrl,
      user_id: user.id,
    },
  });

  if (error) {
    return { ok: false, error: "Unable to process this post right now." };
  }

  if (data && typeof data === "object" && "ok" in data && !data.ok) {
    return { ok: false, error: "Unable to process this post right now." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
