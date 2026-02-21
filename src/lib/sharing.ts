import type { AppState } from "./types";

export function encodeShareUrl(state: AppState): string {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  const base64 = btoa(binary);
  const url = new URL(window.location.href);
  url.searchParams.set("share", base64);
  url.hash = "";
  return url.toString();
}

export function decodeShareParam(param: string): AppState | null {
  try {
    const binary = atob(param);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as AppState;
    if (parsed.settings && Array.isArray(parsed.cars)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function getShareParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("share");
}

export function clearShareParam(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("share");
  window.history.replaceState({}, "", url.toString());
}
