"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { submitNaverPost } from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function registerPost(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const result = await submitNaverPost(formData);

  if (!result.ok) {
    redirect(`/dashboard/register?error=${encodeURIComponent(result.error ?? "Submission failed")}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard/register?success=1");
}
