import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naver Backlink Dashboard",
  description: "Register Naver Blogs and monitor WordPress backlink activity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
