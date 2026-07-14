import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpecHub",
  description: "Thông số thiết bị, các phiên bản, so sánh và tìm kiếm.",
  applicationName: "SpecHub",
  appleWebApp: {
    capable: true,
    title: "SpecHub",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#fffdfd",
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
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
