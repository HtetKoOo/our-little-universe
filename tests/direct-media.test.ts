import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {directMediaInput} from "../src/lib/direct-media-input";
import {verifyOriginalBytes,verifyResource} from "../src/lib/direct-media-validation";

const bytes=new Uint8Array([255,216,255,224,0,1]);
const intent={publicId:"original_assets/couple/hash",expectedBytes:bytes.length,mime:"image/jpeg",contentHash:createHash("sha256").update(bytes).digest("hex")};
const resource={public_id:intent.publicId,resource_type:"image",type:"authenticated",format:"jpg",bytes:bytes.length,width:4032,height:3024};

test("signed-upload inputs allow eight MB and reject invalid fingerprints and formats",()=>{
 const input={hash:intent.contentHash,bytes:8*1024*1024,mime:"image/jpeg"};
 assert.equal(directMediaInput.safeParse(input).success,true);
 for(const change of [{bytes:8*1024*1024+1},{bytes:0},{hash:"forged"},{mime:"image/svg+xml"}])assert.equal(directMediaInput.safeParse({...input,...change}).success,false);
});
test("provider metadata must match a private image for the authorized intent",()=>{
 assert.equal(verifyResource(resource,intent),"jpg");
 for(const change of [{public_id:"other-couple/photo"},{type:"upload"},{resource_type:"raw"},{format:"svg"},{bytes:7},{width:0},{width:10000,height:10000}])assert.throws(()=>verifyResource({...resource,...change},intent),/invalid-upload/);
});
test("original verification rejects forged hash, MIME and changed file bytes",()=>{
 assert.doesNotThrow(()=>verifyOriginalBytes(bytes,intent));
 assert.throws(()=>verifyOriginalBytes(bytes,{...intent,contentHash:"a".repeat(64)}),/invalid-upload/);
 assert.throws(()=>verifyOriginalBytes(bytes,{...intent,mime:"image/png"}),/invalid-upload/);
 assert.throws(()=>verifyOriginalBytes(new Uint8Array([255,216,255,224,0,2]),intent),/invalid-upload/);
});
