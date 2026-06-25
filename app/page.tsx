import { PostSubmitLanding } from "@/components/PostSubmitLanding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "네이버 블로그 구글 노출 자동 등록",
  description: "네이버 블로그 글 URL을 입력하면 구글이 발견하기 쉬운 색인 신호를 만드는 Linkizy 서비스입니다.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <PostSubmitLanding initialAuthenticated={Boolean(user)} />;
}
