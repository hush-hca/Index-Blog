"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extractBlogId } from "@/lib/naver/extractBlogId";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function registerBlog(formData: FormData) {
  const blogUrl = String(formData.get("blog_url") ?? "");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let blogId: string;

  try {
    blogId = extractBlogId(blogUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid blog URL";
    redirect(`/dashboard/register?error=${encodeURIComponent(message)}`);
  }

  const normalizedUrl = `https://blog.naver.com/${blogId}`;
  const { error } = await supabase.from("registered_blogs").insert({
    user_id: user.id,
    blog_url: normalizedUrl,
    blog_id: blogId,
  });

  if (error) {
    redirect(`/dashboard/register?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard/register?success=1");
}
