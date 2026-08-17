import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { QueryProvider } from "@/components/query-provider";
import { ResearchWorkspaceProvider } from "@/components/research-workspace";
import "./globals.css";

const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
const description = "Tìm, so sánh và chọn thiết bị dễ dàng.";

export const metadata: Metadata = {
  title: {
    default: "SpecHub — Chọn thiết bị dễ hơn",
    template: "%s · SpecHub",
  },
  description,
  metadataBase: new URL(webUrl),
  applicationName: "SpecHub",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    title: "SpecHub",
    description,
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "SpecHub — tìm, so sánh và chọn thiết bị",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SpecHub",
    description,
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    title: "SpecHub",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <QueryProvider>
          <ResearchWorkspaceProvider>
            <AppShell>{children}</AppShell>
          </ResearchWorkspaceProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
