import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { blogPosts, getBlogPost } from "@/lib/blog/posts";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} | Linkizy`,
    description: post.description,
    keywords: post.keywords,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="block h-10 w-40" aria-label="Linkizy home">
            <img src="/linkeasy-logo.png" alt="Linkizy" className="h-full w-full object-contain" />
          </Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-slate-950" href="/blog">
            블로그
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-14">
        <p className="text-sm font-semibold text-emerald-700">{post.date}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950">{post.title}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">{post.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {post.keywords.map((keyword) => (
            <span key={keyword} className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
              {keyword}
            </span>
          ))}
        </div>

        <div className="mt-10 space-y-6 rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
          {post.content.map((paragraph) => (
            <p key={paragraph} className="text-base leading-8 text-slate-700">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">Linkizy로 네이버 블로그 글 등록하기</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            구글 노출을 원하는 네이버 블로그 글 주소를 입력하면 모바일 주소 기준으로 접수됩니다.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            URL 등록하러 가기
          </Link>
        </div>
      </article>
    </main>
  );
}
