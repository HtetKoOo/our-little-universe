import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaProvider } from "@/components/pwa-provider";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fff7fa",
};
export const metadata: Metadata = {
  title: {
    default: "Our Little Universe",
    template: "%s · Our Little Universe",
  },
  description: "A private place for our story.",
  appleWebApp: { capable: true, title: "Our Universe", statusBarStyle: "default" },
  icons: { apple: "/pwa/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><PwaProvider>{children}</PwaProvider></body>
    </html>
  );
}
