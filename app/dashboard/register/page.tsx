import { registerPost } from "./actions";

export default async function RegisterBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-950">Submit Naver Blog Post</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add a specific Naver Blog post URL for processing.
        </p>
      </div>

      <form action={registerPost} className="max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Naver Blog Post URL</span>
          <input
            name="post_url"
            type="url"
            required
            placeholder="https://blog.naver.com/exampleid/1234567890"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-emerald-700">Post submitted.</p> : null}
        <button className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Submit Post
        </button>
      </form>
    </section>
  );
}
