"use strict";
document.getElementById("retry").addEventListener("click", () => {
  if (!navigator.onLine) {
    document.getElementById("status").textContent = "Still offline. Check your connection and try again.";
    return;
  }
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- standalone offline HTML has no Next.js router.
  if (location.pathname === "/offline.html") location.assign("/space");
  else location.reload();
});
