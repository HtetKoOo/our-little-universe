import {test} from "node:test";
import assert from "node:assert/strict";
import {memoryInput,coupleInput,pageNumber,memoryAssetIdsInput} from "../src/lib/memory-input";
const valid={title:"A day",body:"A lovely day",happenedOn:"2024-02-29",location:"",isMilestone:true};
test("memory validation rejects impossible dates, empty text and oversized content",()=>{
  for(const change of [{title:" "},{body:" "},{happenedOn:"2025-02-29"},{body:"a".repeat(10001)},{title:"a".repeat(121)},{location:"a".repeat(161)}]) assert.equal(memoryInput.safeParse({...valid,...change}).success,false);
});
test("form ownership fields are discarded and optional location normalized",()=>{
 const parsed=memoryInput.parse({...valid,coupleId:"attacker",createdBy:"attacker"});
 assert.equal("coupleId" in parsed,false);assert.equal("createdBy" in parsed,false);assert.equal(parsed.location,null);
});
test("couple dates and timezone are validated",()=>{
 assert.equal(coupleInput.safeParse({name:"Us",togetherSince:"2024-02-29",timezone:"Asia/Yangon"}).success,true);
 assert.equal(coupleInput.safeParse({name:"Us",togetherSince:"2024-02-29",timezone:"invalid"}).success,false);
});
test("pagination rejects invalid and unbounded offsets",()=>{
 for(const value of ["-1","1.2","Infinity","10001",undefined]) assert.equal(pageNumber(value),1);
 assert.equal(pageNumber("2"),2);
});

test("memory attachments accept 100 valid photos and reject 101", () => {
 const ids = Array.from({length: 101}, (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12,"0")}`);
 assert.equal(memoryAssetIdsInput.safeParse(ids.slice(0,100)).success,true);
 assert.equal(memoryAssetIdsInput.safeParse(ids).success,false);
 assert.equal(memoryAssetIdsInput.safeParse(["not-an-id"]).success,false);
});
