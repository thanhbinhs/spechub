import type { Metadata } from "next";

const webOrigin =
  process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export const metadata: Metadata = {
  title: "SpecHub Wiki — Hướng dẫn, so sánh và mẹo công nghệ",
  description:
    "Thư viện kiến thức công nghệ với bài so sánh thiết bị, hướng dẫn chọn mua và mẹo sử dụng điện thoại dễ làm theo.",
  alternates: { canonical: `${webOrigin}/wiki` },
  openGraph: {
    type: "website",
    url: `${webOrigin}/wiki`,
    title: "SpecHub Wiki — Hiểu thiết bị trước khi chọn",
    description:
      "So sánh thiết bị, hướng dẫn chọn mua và mẹo sử dụng công nghệ từ cộng đồng SpecHub.",
    images: [{ url: `${webOrigin}/og.png`, alt: "SpecHub Wiki" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SpecHub Wiki — Hiểu thiết bị trước khi chọn",
    description:
      "So sánh thiết bị, hướng dẫn chọn mua và mẹo sử dụng công nghệ.",
    images: [`${webOrigin}/og.png`],
  },
};

export default function WikiLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
