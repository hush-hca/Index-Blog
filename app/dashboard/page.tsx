import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProcessingActivityRow = {
  id: string;
  status: string;
  inserted_at: string;
  detected_posts: {
    post_title: string | null;
  } | null;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("backlink_logs")
    .select(
      `
      id,
      status,
      inserted_at,
      detected_posts!inner(
        post_title,
        registered_blogs!inner(user_id)
      )
    `,
    )
    .eq("detected_posts.registered_blogs.user_id", user!.id)
    .order("inserted_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as unknown as ProcessingActivityRow[];

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-950">Recent Processing Activity</h1>
        <p className="mt-1 text-sm text-slate-600">
          Latest processing activity from your submitted Naver Blog posts.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Inserted</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-red-600">
                  {error.message}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-slate-600">
                  No activity yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-950">
                    {row.detected_posts?.post_title ?? "Untitled post"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {formatStatus(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(row.inserted_at))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatStatus(status: string) {
  return status === "SUCCESS" ? "Completed" : "Failed";
}
