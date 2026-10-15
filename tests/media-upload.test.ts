import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { findDuplicatePhoto, uploadSharedPhoto, prepareDuplicatePhotoCheck, resolveDuplicatePhotoCheck } from "../src/lib/media-upload-client";

const asset = { id: "photo-id", format: "jpg", width: 1200, height: 800 };

test("a duplicate lookup hashes file bytes, ignores filename, and avoids uploading the file", async (context) => {
  const calls: string[] = [];
  context.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    calls.push(url);
    assert.equal(url, "/api/media/check");
    assert.equal(JSON.parse(init.body as string).hash, createHash("sha256").update("same pixels").digest("hex"));
    return Response.json({ asset });
  });
  for (const name of ["first.jpg", "renamed.jpg"]) {
    const result = await uploadSharedPhoto(new File(["same pixels"], name, { type: "image/jpeg" }));
    assert.equal(result.duplicate, true);
    assert.deepEqual(result.asset, asset);
  }
  assert.deepEqual(calls, ["/api/media/check", "/api/media/check"]);
});

test("original file goes straight to Cloudinary and only metadata reaches app endpoints", async (context) => {
  const file = new File(["new pixels"], "photo.jpg", { type: "image/jpeg" });
  const calls: string[] = [];
  const uploadUrl = "https://api.cloudinary.com/v1_1/test-cloud/image/upload";
  context.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    calls.push(url);
    if (url === "/api/media/check") return Response.json({ asset: null });
    if (url === "/api/media/prepare") {
      const input = JSON.parse(init.body as string);
      assert.equal(input.bytes,file.size);assert.equal(input.mime,file.type);
      assert.equal(input.hash,createHash("sha256").update("new pixels").digest("hex"));
      return Response.json({intentId:"intent",uploadUrl,fields:{signature:"signed",type:"authenticated"}});
    }
    if (url === uploadUrl) {
      assert.ok(init.body instanceof FormData);
      const uploaded=init.body.get("file") as File;
      assert.equal(await uploaded.text(),"new pixels");
      assert.equal(init.body.get("type"),"authenticated");
      assert.equal(init.credentials,"omit");
      return Response.json({public_id:"provider-photo"});
    }
    assert.equal(url,"/api/media/complete");
    assert.deepEqual(JSON.parse(init.body as string),{intentId:"intent"});
    return Response.json({asset,duplicate:false});
  });
  assert.equal((await uploadSharedPhoto(file)).duplicate,false);
  assert.deepEqual(calls,["/api/media/check","/api/media/prepare",uploadUrl,"/api/media/complete"]);
});

test("failed duplicate checks stop before any upload", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ message: "Please sign in again." }, { status: 403 });
  });
  await assert.rejects(uploadSharedPhoto(new File(["pixels"], "photo.jpg")), /Please sign in again/);
  assert.equal(calls, 1);
});

test("editing file bytes produces a different fingerprint", async (context) => {
  const hashes: string[] = [];
  context.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    hashes.push(JSON.parse(init.body as string).hash);
    return Response.json({ asset: null });
  });
  await findDuplicatePhoto(new File(["original"], "photo.jpg"));
  await findDuplicatePhoto(new File(["edited"], "photo.jpg"));
  assert.notEqual(hashes[0], hashes[1]);
});


test("background result is reused without issuing a second check", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ asset });
  });
  const check = prepareDuplicatePhotoCheck(new File(["pixels"], "photo.jpg"));
  await check;
  assert.deepEqual(await resolveDuplicatePhotoCheck(check), asset);
  assert.deepEqual(await resolveDuplicatePhotoCheck(check), asset);
  assert.equal(calls, 1);
});

test("background errors are captured until the user submits", async (context) => {
  context.mock.method(globalThis, "fetch", async () => {
    throw new Error("Connection lost");
  });
  const check = prepareDuplicatePhotoCheck(new File(["pixels"], "photo.jpg"));
  const result = await check;
  assert.ok(result.error);
  await assert.rejects(resolveDuplicatePhotoCheck(check), /Connection lost/);
});

test("separate file selections keep their own results when replies arrive out of order", async (context) => {
  const firstHash = createHash("sha256").update("first").digest("hex");
  let finishFirst!: (response: Response) => void;
  const firstResponse = new Promise<Response>(resolve => { finishFirst = resolve; });
  context.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    if (JSON.parse(init.body as string).hash === firstHash) return firstResponse;
    return Response.json({ asset: null });
  });
  const first = prepareDuplicatePhotoCheck(new File(["first"], "same-name.jpg"));
  const second = prepareDuplicatePhotoCheck(new File(["second"], "same-name.jpg"));
  assert.equal(await resolveDuplicatePhotoCheck(second), null);
  finishFirst(Response.json({ asset }));
  assert.deepEqual(await resolveDuplicatePhotoCheck(first), asset);
  assert.equal(await resolveDuplicatePhotoCheck(second), null);
});


test("plain-text hosting size errors stay readable", async (context) => {
 context.mock.method(globalThis,"fetch",async(url:string)=>url==="/api/media/check"?Response.json({asset:null}):new Response("FUNCTION_PAYLOAD_TOO_LARGE",{status:413}));
 await assert.rejects(uploadSharedPhoto(new File(["pixels"],"photo.jpg")),/too large.*under 8 MB/);
});


test("a duplicate completed during preparation skips the provider upload",async(context)=>{
 const calls:string[]=[];
 context.mock.method(globalThis,"fetch",async(url:string)=>{
  calls.push(url);return Response.json(url==="/api/media/check"?{asset:null}:{asset,duplicate:true});
 });
 assert.equal((await uploadSharedPhoto(new File(["pixels"],"photo.jpg"))).duplicate,true);
 assert.deepEqual(calls,["/api/media/check","/api/media/prepare"]);
});

test("a failed provider upload never finalizes an unverified photo",async(context)=>{
 const calls:string[]=[];
 context.mock.method(globalThis,"fetch",async(url:string)=>{
  calls.push(url);
  if(url==="/api/media/check")return Response.json({asset:null});
  if(url==="/api/media/prepare")return Response.json({intentId:"intent",uploadUrl:"https://api.cloudinary.com/v1_1/test/image/upload",fields:{signature:"signed"}});
  return Response.json({error:{message:"Unavailable"}},{status:503});
 });
 await assert.rejects(uploadSharedPhoto(new File(["pixels"],"photo.jpg")),/temporarily unavailable/);
 assert.equal(calls.includes("/api/media/complete"),false);
});
