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
            <img src="/linkeasy-logo.png" alt="LinkEasy" className="h-full w-full object-contain" />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="text-slate-600 hover:text-slate-950" href="/blog">
              釉붾줈洹?            </Link>
            <Link className="text-slate-600 hover:text-slate-950" href="/dashboard/register">
              ?깅줉?섍린
            </Link>
            {initialAuthenticated ? (
              <Link
                className="rounded-md bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-700"
                href="/dashboard/register"
              >
                로그인됨
              </Link>
            ) : (
              <Link
                className="rounded-md bg-slate-950 px-3 py-2 font-medium text-white hover:bg-slate-800"
                href="/login"
              >
                로그인
              </Link>
            )}
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
              援ш? ?몄텧???먰븯???ㅼ씠踰?釉붾줈洹??ъ뒪??二쇱냼瑜??낅젰?섏꽭?? ?쒖뒪?쒖씠 紐⑤컮??理쒖쟻??二쇱냼濡?蹂?섑빐 ?묒닔?⑸땲??
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
            <p className="text-sm font-semibold text-emerald-700">?ㅼ씠踰?釉붾줈洹?援ш? ?됱씤 ?깅줉</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-5xl" style={{ lineHeight: 1.35 }}>
              ?댁떖?????ㅼ씠踰?釉붾줈洹?湲, 援ш? 寃?됱갹??二쇱냼瑜?爾먮룄 ???섏삤?쒕굹??
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              蹂듭옟??SEO, 諛깅쭅?? 肄붾뵫? 紐곕씪??愿쒖갖?듬땲?? 留곹겕留??낅젰?섎㈃ 援ш? 濡쒕큸???뱀떊??湲??癒쇱? 李얠븘?ㅺ쾶 留뚮벊?덈떎.
            </p>
            <button
              className="mt-7 rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              onClick={scrollToForm}
              type="button"
            >
              ??釉붾줈洹?援ш????깅줉?섍린
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-sm font-semibold">Indexing Preview</span>
              <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">
                ?꾨즺
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
                寃??寃곌낵????釉붾줈洹?湲???몄텧?섎뒗吏 吏곸젒 ?뺤씤?????덉뒿?덈떎.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <div>
            <p className="text-sm font-semibold text-emerald-700">臾몄젣 ?곹솴</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">?ㅼ씠踰??덉뿉 媛뉙엺 湲</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock
              title="The Pain Point"
              body="?ㅼ썙??留욎텛怨??대?吏 吏곸젒 李띿뼱媛硫??ъ뒪?낆쓣 100媛??섍쾶 ?쇰뒗?? ???좎엯? ?ㅼ씠踰??ы꽭?먮쭔 媛뉙? ?덉쓣源뚯슂?"
            />
            <InfoBlock
              title="The Technical Reality"
              body="?ㅼ씠踰?釉붾줈洹몃뒗 ?대??곸쑝濡?iframe 援ъ“瑜??ъ슜?섎뒗 ?먯뇙?곸씤 ?뚮옯?쇱엯?덈떎. ???뚮Ц??援ш???寃??濡쒕큸??湲???ㅼ젣 ?띿뒪???댁슜???ㅼ뒪濡?諛쒓껄?섍퀬 湲곸뼱媛湲곌? 湲곗닠?곸쑝濡?留ㅼ슦 ?대졄?듬땲??"
            />
            <InfoBlock
              title="The Friction"
              body="?쇰컲?몄씠 援ш? ?쒖튂 肄섏넄 ?몄쬆 ?뚯씪???ш굅?? ?몃? ?ъ씠?몄뿉 諛깅쭅???묒뾽???쇱씪???덉쓣 ?ㅼ뿬 ?섎뒗 寃껋? ?덈Т??癒몃━ ?꾪봽怨?踰덇굅濡쒖슫 ?쇱엯?덈떎."
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
              body="다른 플랫폼에 가입하거나 글을 복사 붙여넣기 하는 작업이 필요 없습니다. 오직 네이버 블로그 링크 하나만 전달하면 끝납니다."
            />
            <ValueCard
              number="02"
              title="실시간 자동화"
              body="주소가 접수되는 즉시 구글 크롤러가 발견할 수 있는 백엔드 인덱싱 파이프라인이 가동됩니다. 사람이 개입하지 않아도 시스템이 자동으로 처리합니다."
            />
            <ValueCard
              number="03"
              title="투명한 검증"
              body="작업이 완료된 후 구글 검색창에서 내 글이 정상적으로 색인되었는지 직접 확인할 수 있습니다."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard
            title="?덈줈???좎엯 梨꾨꼸 ?뺣낫"
            metric="Google Traffic"
            body="?ㅼ씠踰꾩쓽 ??? 寃??濡쒖쭅 蹂寃쎄낵 ??덉쭏 由ъ뒪?ъ뿉 ?섎몮由ъ? ?딅뒗 ?덉젙?곸씤 援ш? ?몃옒?쎌쓣 ??釉붾줈洹몃줈 ?좎엯?쒗궢?덈떎."
          />
          <MetricCard
            title="?κ린?곸씤 留ㅼ텧 諛?愿묎퀬 ?섏씡 利앷?"
            metric="Long-term Growth"
            body="援ш? 寃?됱쓣 ?듯븳 怨좏뭹吏??좎????좎엯?쇰줈 ?좊뱶?ъ뒪???섏씡怨??ъ뾽??釉붾줈洹몄쓽 留ㅼ텧 ?꾪솚 媛?μ꽦???믪엯?덈떎."
          />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-sm font-semibold text-emerald-700">吏꾪뻾 諛⑹떇</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">?대뼸寃??묐룞?섎굹??</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StepCard
              step="Step 1"
              title="URL ?묒닔"
              body="援ш? ?몄텧???먰븯???ㅼ씠踰?釉붾줈洹??ъ뒪??留곹겕瑜??낅젰李쎌뿉 ?깅줉?⑸땲?? ?쒖뒪???대??먯꽌 ?щ·留?理쒖쟻??二쇱냼濡??먮룞 蹂?섎맗?덈떎."
            />
            <StepCard
              step="Step 2"
              title="?됱씤 ?묒뾽"
              body="寃利앸맂 媛援??꾨찓?????꾪궎?띿쿂瑜??쒖슜?섏뿬 Googlebot?먭쾶 ?ㅼ떆媛??됱씤 ?좏샇瑜?蹂대깄?덈떎."
            />
            <StepCard
              step="Step 3"
              title="寃곌낵 由ы룷??諛?吏곸젒 ?뺤씤"
              body="?됱씤 ?깅줉 ??援ш? 遊뉗씠 ?ㅼ젣 ?ㅼ씠踰??쒕쾭瑜??쎌뼱媛湲곌퉴吏 ??7???뺣룄 ?뚯슂?????덉뒿?덈떎. ?꾨즺 ??寃利앸쾿?쇰줈 ?뺤씤??蹂댁꽭??"
            />
          </div>

          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-xl font-semibold text-slate-950">
              ??釉붾줈洹멸? 援ш????됱씤?먮뒗吏 ?뺤씤?섎뒗 媛???뺤떎??諛⑸쾿
            </h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoBlock
                title="site: ?곗궛??寃?됰쾿"
                body="援ш? 寃?됱갹??site:https://m.blog.naver.com/蹂몄씤ID/湲踰덊샇 ?뺥깭濡???紐⑤컮??釉붾줈洹?二쇱냼瑜?寃?됲빐 蹂댁꽭?? ?뺤긽 ?깅줉?섏뿀?ㅻ㈃ ??湲 ?쒕ぉ??寃??寃곌낵???몄텧?⑸땲??"
              />
              <InfoBlock
                title="?쒕ぉ ?곕뵲?댄몴 寃?됰쾿"
                body={'"?ㅼ씠踰?釉붾줈洹??ъ뒪??湲 ?쒕ぉ ?꾩껜"瑜??곕뵲?댄몴濡?媛먯떥 援ш???寃?됲뻽??????釉붾줈洹멸? 泥??섏씠吏???깆옣?쒕떎硫??됱씤???곹깭?낅땲??'}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-[1fr_360px] md:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">臾대즺 ?댁쁺</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">媛寃⑹? ?꾨㈃ 臾대즺(0???낅땲??</h2>
          <p className="mt-4 leading-7 text-slate-600">
            ???쒕퉬?ㅻ뒗 嫄곕????먮낯 ?놁씠, 媛쒕컻??媛쒖씤??釉붾줈嫄곕텇?ㅼ쓽 怨좎땐??怨듦컧?섏뿬 ?щ퉬濡??쒕쾭鍮꾨? 異⑸떦?섎ŉ ?댁쁺?섍퀬 ?덉뒿?덈떎.
            ?쒕퉬?ㅺ? ?꾩????섏뀲?ㅻ㈃ 吏?띿쟻???낅뜲?댄듃? ?덉젙?곸씤 ?쒕쾭 ?좎?瑜??꾪빐 ?곕쑜??而ㅽ뵾 ???붿쓽 ?꾩썝??遺?곷뱶由쎈땲??
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
              title="Q. ??釉붾줈洹멸? ?곸쐞 ?몄텧(1?? ?섎뒗 寃껋쓣 蹂댁옣?섎굹??"
              body="蹂??쒕퉬?ㅻ뒗 援ш? 寃?됱갹????湲??寃??寃곌낵濡??⑤룄濡??깅줉??二쇰뒗 ?몃뜳???쒕퉬?ㅼ엯?덈떎. ?뱀젙 ?ㅼ썙?쒖뿉 ????곸쐞 ?몄텧 ?쒖쐞瑜??몄쐞?곸쑝濡?蹂댁옣?섍굅???쒖뼱?섏????딆쑝硫? 援ш? 寃???뚭퀬由ъ쬁 蹂몄뿰???됯?瑜??곕쫭?덈떎."
            />
            <InfoBlock
              title="Q. ?ㅼ씠踰?釉붾줈洹???덉쭏?대굹 ?⑤꼸???꾪뿕? ?녿굹??"
              body="?ㅼ씠踰?釉붾줈洹?蹂몃Ц?대굹 肄붾뱶瑜??섏젙?섎뒗 諛⑹떇???꾨땶, 援ш? 遊뉗씠 留곹겕瑜??곕씪 ?먯뿰?ㅻ읇寃?諛⑸Ц?섎룄濡?留뚮뱶???쒖? ???꾩썐諛붿슫??留곹겕 援ъ“瑜??ъ슜?섎?濡?湲곗닠?곸쑝濡??덉쟾?⑸땲??"
            />
          </div>
        </div>
      </section>

      {showLoginModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">로그인이 필요합니다</h2>
            <p className="mt-2 text-sm text-slate-600">
              ?ㅼ씠踰?釉붾줈洹?湲???깅줉?섎젮硫?癒쇱? 濡쒓렇?명빐 二쇱꽭??
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
