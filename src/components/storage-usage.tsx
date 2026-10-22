import { HardDrive, ExternalLink } from "lucide-react";
import { requireCouple } from "@/lib/authorization";
import { getDb } from "@/lib/db";
import { storageUsageQuery } from "@/lib/db/storage-usage-query";
import { formatStorageBytes } from "@/lib/storage-usage";

export async function StorageUsage() {
  const actor = await requireCouple();
  let usage: { photoCount: number; totalBytes: number } | undefined;
  try { [usage] = await storageUsageQuery(getDb(), actor); }
  catch { console.error("storage-usage-read-failed"); }
  return <section className="private-account storage-usage" aria-labelledby="storage-usage-title">
    <h2 id="storage-usage-title"><HardDrive size={21} aria-hidden="true" />Photo storage</h2>
    {usage ? <dl className="storage-usage-stats">
      <div><dt>Saved photos</dt><dd>{new Intl.NumberFormat("en").format(usage.photoCount)}</dd></div>
      <div><dt>Saved file size</dt><dd>{formatStorageBytes(usage.totalBytes)}</dd></div>
    </dl> : <p role="status">Photo storage is unavailable right now. Please refresh to try again.</p>}
    <p className="storage-usage-note">Photos in your shared Gallery, counted once even when used in several memories. Preview images and bandwidth are not included.</p>
    {actor.role === "owner" && <a className="storage-dashboard-link" href="https://console.cloudinary.com/" target="_blank" rel="noopener noreferrer">View Cloudinary account usage <ExternalLink size={15} aria-hidden="true" /></a>}
  </section>;
}
