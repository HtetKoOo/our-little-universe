import {test} from "node:test";
import assert from "node:assert/strict";
import {privatePhotoResponse} from "../src/lib/private-photo-response";
const tag='"couple-photo-thumbnail-v2"';
const req=(etag?:string)=>new Request('https://app.test/api/media/photo?size=thumbnail',{headers:etag?{'if-none-match':etag}:{}});

test('unchanged private photo reuses cache without fetching provider bytes',async()=>{
 let reads=0;
 const response=await privatePhotoResponse(req(tag),tag,async()=>{reads++;return new Response();});
 assert.equal(response.status,304);assert.equal(reads,0);
 assert.match(response.headers.get('cache-control')!,/private, no-cache/);
 assert.match(response.headers.get('vary')!,/Cookie/);
 assert.equal(await response.text(),'');
});
test('thumbnail cache is not used for a different preview or photo',async()=>{
 let reads=0;
 const response=await privatePhotoResponse(req(tag),'"couple-photo-preview-v2"',async()=>{reads++;return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/jpeg'}});});
 assert.equal(response.status,200);assert.equal(reads,1);
 assert.deepEqual(new Uint8Array(await response.arrayBuffer()),new Uint8Array([1,2,3]));
});
test('weak conditional tags work and provider failures are not cached',async()=>{
 const cached=await privatePhotoResponse(req(`W/${tag}`),tag,async()=>{throw new Error('should not fetch');});
 assert.equal(cached.status,304);
 const failed=await privatePhotoResponse(req(),tag,async()=>new Response('unavailable',{status:503}));
 assert.equal(failed.status,502);assert.match(failed.headers.get('cache-control')!,/no-store/);
});
test('non-image responses never become cached photo data',async()=>{
 const response=await privatePhotoResponse(req(),tag,async()=>new Response('<html>sign in</html>',{headers:{'content-type':'text/html'}}));
 assert.equal(response.status,502);assert.match(response.headers.get('cache-control')!,/no-store/);
});
