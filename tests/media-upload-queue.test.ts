import { test } from "node:test";
import assert from "node:assert/strict";
import { uploadPhotoBatch } from "../src/lib/media-upload-queue";
import { PhotoUploadError } from "../src/lib/media-upload-client";

const result = (id: string, duplicate = false) => ({asset:{id,format:"jpg",width:100,height:100},duplicate});
const files = (count: number) => Array.from({length:count},(_, i)=>new File([String(i)],`${i}.jpg`,{type:"image/jpeg"}));

test("ten-file batch runs sequentially with cooldown and complete progress", async () => {
 const events: string[]=[];
 const attached: string[]=[];
 const progress: number[]=[];
 let active=0;
 const failed=await uploadPhotoBatch(files(10),value=>attached.push(value.asset.id),value=>progress.push(value.completed),{
  upload:async file=>{active++; assert.equal(active,1); events.push(file.name); await Promise.resolve(); active--; return result(file.name);},
  wait:async milliseconds=>{assert.ok(milliseconds>=3000); events.push("wait");},
 });
 assert.equal(failed.length,0);
 assert.equal(attached.length,10);
 assert.equal(events.filter(value=>value==="wait").length,9);
 assert.equal(progress.at(-1),10);
 assert.deepEqual(events.slice(0,3),["0.jpg","wait","1.jpg"]);
});

test("partner cooldown is retried but permanently failed photos do not stop the batch", async () => {
 const attempts=new Map<string,number>();
 const attached:string[]=[];
 const failed=await uploadPhotoBatch(files(3),value=>attached.push(value.asset.id),()=>{}, {
  upload:async file=>{
   const count=(attempts.get(file.name)??0)+1;attempts.set(file.name,count);
   if(file.name==="0.jpg"&&count===1)throw new PhotoUploadError("Wait",429);
   if(file.name==="1.jpg")throw new PhotoUploadError("Invalid photo",415);
   return result(file.name);
  },wait:async()=>{},
 });
 assert.deepEqual(attached,["0.jpg","2.jpg"]);
 assert.equal(attempts.get("0.jpg"),2);
 assert.equal(attempts.get("1.jpg"),1);
 assert.equal(failed[0].file.name,"1.jpg");
 assert.equal(failed[0].message,"Invalid photo");
});

test("retry only failed files, leaving previous successful files alone", async () => {
 const initial=files(2);
 const first=await uploadPhotoBatch(initial,()=>{},()=>{}, {upload:async file=>{if(file.name==="1.jpg")throw new Error("Offline");return result(file.name);},wait:async()=>{}});
 const calls:string[]=[];
 const second=await uploadPhotoBatch(first.map(item=>item.file),()=>{},()=>{}, {upload:async file=>{calls.push(file.name);return result(file.name);},wait:async()=>{}});
 assert.deepEqual(calls,["1.jpg"]);assert.equal(second.length,0);
});

test("reused duplicates require no cooldown", async () => {
 let waits=0;
 await uploadPhotoBatch(files(3),()=>{},()=>{}, {upload:async file=>result(file.name,true),wait:async()=>{waits++;}});
 assert.equal(waits,0);
});

test("cooldown retries are bounded and eleven-file batches are refused", async () => {
 let attempts=0;
 const upload=async()=>{attempts++;throw new PhotoUploadError("Wait",429);};
 const failed=await uploadPhotoBatch(files(1),()=>{},()=>{}, {upload,wait:async()=>{}});
 assert.equal(attempts,4);assert.equal(failed.length,1);
 await assert.rejects(uploadPhotoBatch(files(11),()=>{},()=>{}, {upload,wait:async()=>{}}),/between 1 and 10/);
 assert.equal(attempts,4);
});
