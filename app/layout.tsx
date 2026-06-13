import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linkizy",
  description: "네이버 블로그 글의 구글 노출과 색인 등록을 간편하게 돕는 Linkizy 서비스입니다.",
};

const adsenseClient = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {adsenseClient ? (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
