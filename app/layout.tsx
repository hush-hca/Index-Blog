import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkEasy",
  description: "네이버 블로그 글의 구글 색인 신호를 간편하게 등록합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
