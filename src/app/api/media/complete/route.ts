import { requireCouple } from "@/lib/authorization";
import { completeDirectMedia } from "@/lib/direct-media";
import { completeMediaInput } from "@/lib/direct-media-input";
import { sameOrigin, limitedBody } from "@/lib/heart-photo-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function POST(request: Request) {
  if (!sameOrigin(request, process.env.BETTER_AUTH_URL))
    return Response.json({ message: "This upload request was blocked." },{ status:403, headers });
  const actor = await requireCouple();
  try {
    const bytes = await limitedBody(request,1024);
    const input = completeMediaInput.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    if (!input.success) return Response.json({ message:"Please choose a JPG, PNG or WebP photo under 8 MB." },{status:400,headers});
    const result = await completeDirectMedia(actor, input.data.intentId);
    if ("asset" in result && result.asset) {
      const {id,format,width,height} = result.asset;
      return Response.json({ asset:{id,format,width,height},duplicate:result.duplicate },{headers});
    }
    return Response.json(result,{headers});
  } catch(error) {
    const code = error instanceof Error ? error.message : "unknown";
    const status = code==="upload-rate-limit" ? 429 : code==="upload-expired" ? 410 : code==="invalid-upload" || code==="too-large" ? 422 : 503;
    const message = status===429 ? "Please wait a moment before uploading again." : status===410 ? "This upload expired. Please choose the photo again." : status===422 ? "This file could not be verified. Choose a supported photo under 8 MB and 40 megapixels." : "Photo upload could not finish. Please try again.";
    console.error("media-complete-failed",{code: ["upload-rate-limit","upload-expired","invalid-upload","too-large","save-failed","provider-unavailable"].includes(code)?code:"service-error"});
    return Response.json({message},{status,headers});
  }
}
