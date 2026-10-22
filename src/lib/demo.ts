// Fictional, public examples. Never put personal content or credentials here.
export const demoMemories = [
  {
    id: "1",
    title: "The evening we took the long way home",
    date: "2026-08-22",
    location: "By the river",
    category: "Little moments",
    body: "No plans. Just a walk, a sky turning pink, and one more reason to stay a little longer.",
  },
  {
    id: "2",
    title: "A table for two",
    date: "2026-07-10",
    location: "Our favorite café",
    category: "Everyday magic",
    body: "Your coffee went cold because we couldn't stop talking. I would choose that afternoon again.",
  },
  {
    id: "3",
    title: "Where our story began",
    date: "2025-09-14",
    location: "Our first hello",
    category: "Our firsts",
    body: "Such an ordinary day to meet someone who would make everything feel different.",
  },
];
export const demoNotes = [
  "I love the way you make ordinary days feel special.",
  "A little reminder: you are my favorite person to come home to.",
  "Let's take the long way home again.",
];

const demoHeartSlide = (first: string, second: string, accent: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 440"><defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${first}"/><stop offset="1" stop-color="${second}"/></linearGradient></defs><rect width="480" height="440" fill="url(#sky)"/><circle cx="88" cy="92" r="52" fill="#fff" fill-opacity=".28"/><circle cx="392" cy="335" r="96" fill="#fff" fill-opacity=".2"/><path d="M151 309c-39-36-91-84-91-142 0-49 62-71 91-21 29-50 91-28 91 21 0 58-52 106-91 142Z" fill="${accent}" fill-opacity=".72"/><path d="M316 313c-31-29-71-66-71-112 0-39 49-56 71-17 22-39 71-22 71 17 0 46-40 83-71 112Z" fill="#fff" fill-opacity=".82"/><text x="240" y="78" text-anchor="middle" fill="#fff" font-family="Georgia, serif" font-size="27" font-style="italic">a little us</text></svg>`)}`;

// Artwork is fictional and intentionally contains no private photographs.
export const demoHeartPhotos = [
  { src: demoHeartSlide("#f7bdd2", "#f9dfc8", "#b13f6d"), alt: "A rosy sample moment" },
  { src: demoHeartSlide("#d9c8ef", "#f8e3c4", "#9b5b87"), alt: "A lavender sample moment" },
  { src: demoHeartSlide("#f3c9bc", "#f7dfd5", "#a85171"), alt: "A warm sample moment" },
];

// Sample metadata only: these sizes illustrate originals without uploading files.
export const demoGalleryPhotos = Array.from({ length: 66 }, (_, index) => ({
  id: `sample-photo-${index + 1}`,
  memoryId: demoMemories[index % demoMemories.length].id,
  src: demoHeartPhotos[(index + Math.floor(index / 3)) % demoHeartPhotos.length].src,
  alt: `${demoMemories[index % demoMemories.length].category} — sample photo ${index + 1}`,
  bytes: 1_200_000 + index * 12_500,
}));
