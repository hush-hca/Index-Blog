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
      setMessage(result.message ?? "Post submitted successfully.");
    });
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="block h-10 w-40" aria-label="LinkEasy home">
            <img src="/linkeasy-logo.svg" alt="LinkEasy" className="h-full w-full object-contain" />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="text-slate-600 hover:text-slate-950" href="/dashboard/register">
              등록하기
            </Link>
            <Link
              className="rounded-md bg-slate-950 px-3 py-2 font-medium text-white hover:bg-slate-800"
              href="/login"
            >
              로그인
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl content-center px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-700">LinkEasy</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              Submit a Naver Blog post
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              구글 노출을 원하는 네이버 블로그 포스팅 주소를 입력하세요. 시스템이 모바일 최적화 주소로 변환해 접수합니다.
            </p>
          </div>

          <form
            ref={formRef}
            action={onSubmit}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
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
              className="mt-5 w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isPending ? "Submitting..." : "Submit Post"}
            </button>
          </form>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_460px] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-700">네이버 블로그 구글 색인 등록</p>
            <h2 className="mt-3 text-3xl font-semibold leading-snug text-slate-950 sm:text-5xl">
              열심히 쓴 네이버 블로그 글, 구글 검색창에 주소를 쳐도 안 나오시나요?
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              복잡한 SEO, 백링크, 코딩은 몰라도 괜찮습니다. 링크만 입력하면 구글 로봇이 당신의 글을 먼저 찾아오게 만듭니다.
            </p>
            <button
              className="mt-7 rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              onClick={scrollToForm}
              type="button"
            >
              내 블로그 구글에 등록하기
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-sm font-semibold">Indexing Preview</span>
              <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">
                완료
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {["URL 접수", "색인 신호 전송", "Googlebot 방문 대기", "검색 확인 준비"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-md bg-white/8 p-3">
                  <span className="grid h-7 w-7 place-items-center rounded bg-emerald-400 text-xs font-bold text-slate-950">
                    {index + 1}
                  </span>
                  <div className="h-2 flex-1 rounded bg-white/15">
                    <div className="h-2 rounded bg-emerald-400" style={{ width: `${95 - index * 14}%` }} />
                  </div>
                  <span className="w-24 text-xs text-slate-200">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md bg-white p-4 text-slate-950">
              <p className="text-xs text-slate-500">Google Search</p>
              <p className="mt-2 text-sm font-medium">site:https://m.blog.naver.com/...</p>
              <p className="mt-3 rounded bg-emerald-50 p-3 text-sm text-emerald-800">
                검색 결과에 내 블로그 글이 노출되는지 직접 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <div>
            <p className="text-sm font-semibold text-emerald-700">문제 상황</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">네이버 안에 갇힌 글</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock
              title="The Pain Point"
              body="키워드 맞추고 이미지 직접 찍어가며 포스팅을 100개 넘게 썼는데, 왜 유입은 네이버 포털에만 갇혀 있을까요?"
            />
            <InfoBlock
              title="The Technical Reality"
              body="네이버 블로그는 내부적으로 iframe 구조를 사용하는 폐쇄적인 플랫폼입니다. 이 때문에 구글의 검색 로봇이 글의 실제 텍스트 내용을 스스로 발견하고 긁어가기가 기술적으로 매우 어렵습니다."
            />
            <InfoBlock
              title="The Friction"
              body="일반인이 구글 서치 콘솔 인증 파일을 심거나, 외부 사이트에 백링크 작업을 일일이 품을 들여 하는 것은 너무나 머리 아프고 번거로운 일입니다."
            />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8">
            <p className="text-sm font-semibold text-emerald-700">핵심 가치</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">링크 하나로 끝나는 자동화</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <ValueCard
              number="01"
              title="압도적 간편함"
              body='다른 플랫폼에 가입하거나 글을 복사 붙여넣기 하는 노가다가 전혀 없습니다. 오직 네이버 블로그 "링크(URL)" 딱 하나만 전달하면 끝납니다.'
            />
            <ValueCard
              number="02"
              title="실시간 자동화"
              body="주소가 접수되는 즉시 구글 크롤러가 발견할 수 있는 백엔드 인덱싱 파이프라인이 가동됩니다. 사람이 개입하지 않아도 시스템이 자동으로 처리합니다."
            />
            <ValueCard
              number="03"
              title="투명한 검증"
              body="작업이 완료된 후, 구글 검색창에서 내 글이 정상적으로 색인되었는지 누구나 직접 1초 만에 눈으로 확인할 수 있습니다."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard
            title="새로운 유입 채널 확보"
            metric="Google Traffic"
            body="네이버의 잦은 검색 로직 변경과 저품질 리스크에 휘둘리지 않는 안정적인 구글 트래픽을 내 블로그로 유입시킵니다."
          />
          <MetricCard
            title="장기적인 매출 및 광고 수익 증가"
            metric="Long-term Growth"
            body="구글 검색을 통한 고품질 유저의 유입으로 애드포스트 수익과 사업자 블로그의 매출 전환 가능성을 높입니다."
          />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-sm font-semibold text-emerald-700">진행 방식</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">어떻게 작동하나요?</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StepCard
              step="Step 1"
              title="URL 접수"
              body="구글 노출을 원하는 네이버 블로그 포스팅 링크를 입력창에 등록합니다. 시스템 내부에서 크롤링 최적화 주소로 자동 변환됩니다."
            />
            <StepCard
              step="Step 2"
              title="색인 작업"
              body="검증된 가교 도메인 웹 아키텍처를 활용하여 Googlebot에게 실시간 색인 신호를 보냅니다."
            />
            <StepCard
              step="Step 3"
              title="결과 리포트 및 직접 확인"
              body="색인 등록 후 구글 봇이 실제 네이버 서버를 읽어가기까지 약 7일 정도 소요될 수 있습니다. 완료 후 검증법으로 확인해 보세요."
            />
          </div>

          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-xl font-semibold text-slate-950">
              내 블로그가 구글에 색인됐는지 확인하는 가장 확실한 방법
            </h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoBlock
                title="site: 연산자 검색법"
                body="구글 검색창에 site:https://m.blog.naver.com/본인ID/글번호 형태로 내 모바일 블로그 주소를 검색해 보세요. 정상 등록되었다면 내 글 제목이 검색 결과에 노출됩니다."
              />
              <InfoBlock
                title="제목 큰따옴표 검색법"
                body={'"네이버 블로그 포스팅 글 제목 전체"를 큰따옴표로 감싸 구글에 검색했을 때 내 블로그가 첫 페이지에 등장한다면 색인된 상태입니다.'}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-[1fr_360px] md:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">무료 운영</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">가격은 전면 무료(0원)입니다.</h2>
          <p className="mt-4 leading-7 text-slate-600">
            이 서비스는 거대한 자본 없이, 개발자 개인이 블로거분들의 고충에 공감하여 사비로 서버비를 충당하며 운영하고 있습니다.
            서비스가 도움이 되셨다면 지속적인 업데이트와 안정적인 서버 유지를 위해 따뜻한 커피 한 잔의 후원을 부탁드립니다.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-500">Support LinkEasy</p>
          <button className="mt-4 w-full rounded-md bg-yellow-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-yellow-300">
            Buy me a coffee
          </button>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-sm font-semibold text-emerald-700">FAQ & Trust Policy</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoBlock
              title="Q. 내 블로그가 상위 노출(1등) 되는 것을 보장하나요?"
              body="본 서비스는 구글 검색창에 내 글이 검색 결과로 뜨도록 등록해 주는 인덱싱 서비스입니다. 특정 키워드에 대한 상위 노출 순위를 인위적으로 보장하거나 제어하지는 않으며, 구글 검색 알고리즘 본연의 평가를 따릅니다."
            />
            <InfoBlock
              title="Q. 네이버 블로그 저품질이나 패널티 위험은 없나요?"
              body="네이버 블로그 본문이나 코드를 수정하는 방식이 아닌, 구글 봇이 링크를 따라 자연스럽게 방문하도록 만드는 표준 웹 아웃바운드 링크 구조를 사용하므로 기술적으로 안전합니다."
            />
          </div>
        </div>
      </section>

      {showLoginModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">로그인이 필요합니다</h2>
            <p className="mt-2 text-sm text-slate-600">
              네이버 블로그 글을 등록하려면 먼저 로그인해 주세요.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setShowLoginModal(false)}
                type="button"
              >
                취소
              </button>
              <Link
                className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                href="/login"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function ValueCard({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
      <p className="text-sm font-bold text-emerald-700">{number}</p>
      <h3 className="mt-4 text-xl font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function MetricCard({ title, metric, body }: { title: string; metric: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-3xl font-semibold text-emerald-700">{metric}</p>
      <h3 className="mt-4 text-xl font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function StepCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-emerald-700">{step}</p>
      <h3 className="mt-3 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
