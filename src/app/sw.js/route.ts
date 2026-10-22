import { pwaWorker } from "@/lib/pwa-worker";
export const dynamic = "force-static";
export function GET() {
  return new Response(pwaWorker(process.env.NEXT_PUBLIC_PWA_VERSION ?? "development"), { headers: {
    "Content-Type": "application/javascript; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Service-Worker-Allowed": "/",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; connect-src 'self'",
  } });
}
