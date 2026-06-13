import Link from "next/link";
import type { Metadata } from "next";
import { blogPosts } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Linkizy 블로그",
  description: "네이버 블로그 구글 노출, 색인 확인, 블로그 SEO에 대한 Linkizy 가이드입니다.",
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="block h-10 w-40" aria-label="Linkizy home">
            <img src="/linkeasy-logo.png" alt="Linkizy" className="h-full w-full object-contain" />
          </Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-slate-950" href="/">
            홈으로
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-sm font-semibold text-emerald-700">Linkizy Blog</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950">네이버 블로그 구글 노출 가이드</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          네이버 블로그 글이 구글에 발견되고 색인될 수 있도록 돕는 실전 가이드입니다.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {blogPosts.map((post) => (
            <article key={post.slug} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs text-slate-500">{post.date}</p>
              <h2 className="mt-3 text-xl font-semibold leading-7 text-slate-950">
                <Link href={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{post.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.keywords.slice(0, 3).map((keyword) => (
                  <span key={keyword} className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
                    {keyword}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
