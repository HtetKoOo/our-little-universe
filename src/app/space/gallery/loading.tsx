import { Suspense } from "react";
import { GalleryLoading } from "@/components/gallery-loading";
export default function Loading() { return <Suspense fallback={null}><GalleryLoading /></Suspense>; }
