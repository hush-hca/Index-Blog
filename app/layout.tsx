import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naver Post Dashboard",
  description: "Submit Naver Blog posts and monitor processing activity.",
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
