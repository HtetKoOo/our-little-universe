// Call only AFTER authenticating and authorizing the photo for this request.
// no-cache permits storage but requires authorization again before reuse.
export async function privatePhotoResponse(request: Request, tag: string, load: () => Promise<Response>) {
  const headers = {
    "Cache-Control":"private, no-cache, max-age=0, must-revalidate",
    Vary:"Cookie", ETag:tag,
    "X-Content-Type-Options":"nosniff",
    "Cross-Origin-Resource-Policy":"same-origin",
  };
  const tags = request.headers.get("if-none-match")?.split(",").map(value => value.trim().replace(/^W\//,"")) ?? [];
  if (tags.includes(tag) || tags.includes("*")) return new Response(null,{status:304,headers});
  const upstream = await load();
  const contentType = upstream.headers.get("content-type");
  if (!upstream.ok || !["image/jpeg", "image/png", "image/webp"].some(type => contentType?.startsWith(type)) || !upstream.body) {
    await upstream.body?.cancel();
    return new Response(null,{status:502,headers:{...headers,"Cache-Control":"private, no-store"}});
  }
  // A fixed preview is bounded independently of the stored original's size.
  const { limitedBody } = await import("./heart-photo-input");
  const bytes = await limitedBody(new Request("https://internal.invalid",{method:"POST",body:upstream.body,duplex:"half"} as RequestInit),4*1024*1024);
  return new Response(bytes as BodyInit,{headers:{...headers,"Content-Type":contentType!}});
}
