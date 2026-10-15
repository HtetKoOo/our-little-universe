// Explicit live integration test. Uses only generated pixels and isolated fixtures.
// node --conditions=react-server --import tsx scripts/test-heart-photo-live.ts
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
nextEnv.loadEnvConfig(process.cwd());
function pixels() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Jg7sAAAAASUVORK5CYII=",
    "base64",
  );
}
async function main() {
  const {getAuth}=await import('../src/lib/auth');
  const {getCloudinary}=await import('../src/lib/cloudinary');
  const {uploadHeartPhoto,saveHeartPhotos,cleanupHeartPhotos}=await import('../src/lib/heart-photo');
  const {findMediaAsset,uploadMemoryImage}=await import('../src/lib/media');
  const {GET}=await import('../src/app/api/heart-photo/[id]/route');
  const sql=neon(process.env.DATABASE_URL!);
  const a=randomUUID(),b=randomUUID(),u=randomUUID(),v=randomUUID();
  const password=randomUUID()+randomUUID();const hash=await hashPassword(password);
  let phase='fixtures'; let initialized=false;
  try {
    await sql.transaction([
      sql`insert into "user" (id,name,email) values (${u},'Photo fixture',${u+'@example.invalid'}),(${v},'Photo fixture',${v+'@example.invalid'})`,
      sql`insert into account (id,account_id,provider_id,user_id,password) values (${randomUUID()},${u},'credential',${u},${hash}),(${randomUUID()},${v},'credential',${v},${hash})`,
      sql`insert into couples (id,name,together_since) values (${a}::uuid,'Photo fixture','2024-01-01'),(${b}::uuid,'Photo fixture','2024-01-01')`,
      sql`insert into couple_members(couple_id,user_id,role) values (${a}::uuid,${u},'owner'),(${b}::uuid,${v},'owner')`,
    ]); initialized=true;
    phase='sign-in';
    async function login(id:string) {
      const response=await getAuth().api.signInEmail({body:{email:id+'@example.invalid',password},headers:new Headers({origin:new URL(process.env.BETTER_AUTH_URL!).origin}),asResponse:true});
      assert.equal(response.status,200);
      return response.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
    }
    const ownCookie=await login(u),otherCookie=await login(v);
    phase='upload';
  const actor={coupleId:a,userId:u,photos:[],legacyPhoto:null,revision:0};
    const photo=await uploadHeartPhoto(actor,pixels());
    assert.equal(photo.width,1);assert.equal(photo.height,1);assert.equal(photo.format,"png");
    phase='duplicate reuse';
    const repeated=await uploadMemoryImage(actor,pixels());
    assert.equal(repeated.id,photo.id);assert.equal(repeated.duplicate,true);
    phase='publish';assert.ok(await saveHeartPhotos(actor,0,[photo]));
    phase='private app delivery';
    const request=(cookie?:string)=>new Request('http://localhost/api/heart-photo/'+photo.id,{headers:cookie?{cookie}:{}});
    const context={params:Promise.resolve({id:photo.id})};
    const own=await GET(request(ownCookie),context);assert.equal(own.status,200);assert.ok((await own.arrayBuffer()).byteLength>0);assert.match(own.headers.get('cache-control')!,/no-store/);
    assert.equal((await GET(request(),context)).status,404);
    assert.equal((await GET(request(otherCookie),context)).status,404);
    const stored = await findMediaAsset(actor, photo.id);
    assert.ok(stored);
    phase='provider anonymous denial';
    for(const transformation of [undefined,{width:10,crop:'scale'}]) {
      const url=getCloudinary().url(stored.publicId,{secure:true,resource_type:'image',type:'authenticated',format:'jpg',sign_url:false,transformation});
      const result=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});
      assert.ok([401,403,404].includes(result.status)); await result.body?.cancel();
    }
    phase='crop and stale revision';
    const positioned={...photo,crop:{zoom:2,x:20,y:70}};
    assert.ok(await saveHeartPhotos({...actor,photos:[photo],revision:1},1,[positioned]));
    assert.equal(await saveHeartPhotos(actor,0,[photo]),undefined);
    phase='removal'; assert.ok(await saveHeartPhotos({...actor,photos:[positioned],revision:2},2,[]));
    assert.equal((await GET(request(ownCookie),context)).status,404);
    phase='library retention';assert.equal(await cleanupHeartPhotos(photo.id),0);assert.ok(await findMediaAsset(actor,photo.id));
    console.log('PASS: real authenticated upload; app image delivery; logged-out/second-couple denial; unsigned original/derivative denial; crop update; stale revision denial; removal from card; shared library retention.');
  } catch { throw new Error('Live photo check failed at '+phase+'. No secrets or provider URLs printed.'); }
  finally {
    if(initialized){
      await sql`update couples set heart_photos=null, heart_photo=null where id=${a}::uuid`;
      const assets=await sql`select public_id from media_assets where couple_id=${a}::uuid`;
      let safe=true;
      for(const asset of assets) {
        const result=await getCloudinary().uploader.destroy(asset.public_id,{resource_type:'image',type:'authenticated',invalidate:true});
        if(!['ok','not found'].includes(result.result))safe=false;
      }
      if(safe){
        await sql.transaction([
          sql`delete from media_assets where couple_id=${a}::uuid`,
          sql`delete from heart_photo_uploads where couple_id=${a}::uuid`,
          sql`delete from couple_members where couple_id in (${a}::uuid,${b}::uuid)`,
          sql`delete from couples where id in (${a}::uuid,${b}::uuid)`,
          sql`delete from "user" where id in (${u},${v})`,
        ]);
        console.log('Test fixtures and sessions removed.');
      }else throw new Error('Provider cleanup needs retry; fixture ledger retained. No personal records changed.');
    }
  }
}
main().catch(error=>{console.error(error instanceof Error && /^(Live photo check|Provider cleanup)/.test(error.message)?error.message:'Live photo test failed; details suppressed.');process.exitCode=1;});
