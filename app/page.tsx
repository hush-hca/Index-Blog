import { PostSubmitLanding } from "@/components/PostSubmitLanding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <PostSubmitLanding initialAuthenticated={Boolean(user)} />;
}
