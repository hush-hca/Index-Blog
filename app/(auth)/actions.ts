"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginWithGoogle() {
  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const siteUrl = getSiteUrl(headerStore);

  if (!siteUrl) {
    redirect("/login?error=Missing%20site%20origin");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Google login failed")}`);
  }

  redirect(data.url);
}

function getSiteUrl(headerStore: Headers) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

  if (configuredUrl) {
    return configuredUrl;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";

  if (host) {
    return `${protocol}://${host}`;
  }

  return headerStore.get("origin")?.replace(/\/+$/, "") ?? null;
}
