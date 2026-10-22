export function formatStorageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unavailable";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(1000)), units.length - 1));
  const value = bytes / 1000 ** index;
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: index ? 2 : 0 }).format(value)} ${units[index]}`;
}
