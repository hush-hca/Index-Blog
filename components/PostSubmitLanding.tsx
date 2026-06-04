"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { submitNaverPost } from "@/app/actions";

export function PostSubmitLanding({
  initialAuthenticated,
}: {
  initialAuthenticated: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    if (!initialAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    startTransition(async () => {
      const result = await submitNaverPost(formData);

      if (result.requiresAuth) {
        setShowLoginModal(true);
        return;
      }

      if (!result.ok) {
        setError(result.error ?? "Submission failed");
        return;
      }

      formRef.current?.reset();
      setMessage("Post submitted successfully.");
    });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-slate-950">
            Naver Post Dashboard
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="text-slate-600 hover:text-slate-950" href="/dashboard">
              Dashboard
            </Link>
            <Link
              className="rounded-md bg-slate-950 px-3 py-2 font-medium text-white hover:bg-slate-800"
              href="/login"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-5xl content-center px-4 py-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            Submit a Naver Blog post
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Paste a specific Naver Blog post URL to process it.
          </p>
        </div>

        <form
          ref={formRef}
          action={onSubmit}
          className="mt-8 max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Naver Blog Post URL</span>
            <input
              name="post_url"
              type="url"
              required
              placeholder="https://blog.naver.com/exampleid/1234567890"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-900"
            />
          </label>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          <button
            disabled={isPending}
            className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isPending ? "Submitting..." : "Submit Post"}
          </button>
        </form>
      </section>

      {showLoginModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">Login required</h2>
            <p className="mt-2 text-sm text-slate-600">
              Please log in before submitting a Naver Blog post.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setShowLoginModal(false)}
                type="button"
              >
                Cancel
              </button>
              <Link
                className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                href="/login"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
