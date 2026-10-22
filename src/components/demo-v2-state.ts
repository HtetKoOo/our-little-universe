"use client";
import { useSyncExternalStore } from "react";
import { defaultDemoState, demoStateInput, updateDemoState, type DemoV2Action, type DemoV2State } from "@/lib/demo-v2";
const key = "our-little-universe-demo-v2";
let cached: DemoV2State | undefined;
const listeners = new Set<() => void>();
function snapshot() {
  if (cached) return cached;
  try {
    const parsed = demoStateInput.safeParse(JSON.parse(sessionStorage.getItem(key) ?? "null"));
    cached = parsed.success ? parsed.data : defaultDemoState;
  } catch { cached = defaultDemoState; }
  return cached;
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function useDemoV2() {
  const state = useSyncExternalStore(subscribe, snapshot, () => defaultDemoState);
  function dispatch(action: DemoV2Action) {
    cached = updateDemoState(snapshot(), action);
    try { sessionStorage.setItem(key, JSON.stringify(cached)); } catch { /* Still usable in this page session when browser storage is blocked. */ }
    listeners.forEach(listener => listener());
  }
  return { state, dispatch };
}
