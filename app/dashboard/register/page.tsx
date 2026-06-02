import { registerBlog } from "./actions";

export default async function RegisterBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-950">Register Naver Blog</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add a Naver Blog URL to start hourly RSS monitoring.
        </p>
      </div>

      <form action={registerBlog} className="max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Naver Blog URL</span>
          <input
            name="blog_url"
            type="url"
            required
            placeholder="https://blog.naver.com/exampleid"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-emerald-700">Blog registered.</p> : null}
        <button className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Register
        </button>
      </form>
    </section>
  );
}
