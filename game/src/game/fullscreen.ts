/** Fullscreen / standalone helpers for usable mobile play */

export function isStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  // Only true home-screen / installed PWA — not display-mode:fullscreen
  // (some browsers/engines match fullscreen MQ without a real FS session).
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function isFullscreen(): boolean {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
  };
  return !!(document.fullscreenElement || doc.webkitFullscreenElement || isStandalone());
}

export async function enterFullscreen(el: HTMLElement = document.documentElement): Promise<boolean> {
  try {
    const anyEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      webkitRequestFullScreen?: () => Promise<void> | void;
    };
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: "hide" } as FullscreenOptions);
      return true;
    }
    if (anyEl.webkitRequestFullscreen) {
      await Promise.resolve(anyEl.webkitRequestFullscreen());
      return true;
    }
    if (anyEl.webkitRequestFullScreen) {
      await Promise.resolve(anyEl.webkitRequestFullScreen());
      return true;
    }
  } catch {
    /* user gesture / policy */
  }
  return isFullscreen();
}

export async function exitFullscreen(): Promise<void> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
  };
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await Promise.resolve(doc.webkitExitFullscreen());
    }
  } catch {
    /* ignore */
  }
}

export async function lockLandscape(): Promise<void> {
  try {
    const o = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    if (o?.lock) await o.lock("landscape");
  } catch {
    /* not allowed outside fullscreen / unsupported */
  }
}

export function onFullscreenChange(cb: () => void): () => void {
  const handler = () => cb();
  document.addEventListener("fullscreenchange", handler);
  document.addEventListener("webkitfullscreenchange", handler);
  window.addEventListener("resize", handler);
  return () => {
    document.removeEventListener("fullscreenchange", handler);
    document.removeEventListener("webkitfullscreenchange", handler);
    window.removeEventListener("resize", handler);
  };
}

export function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** True when browser chrome would make the match unusable */
export function needsFullscreenGate(): boolean {
  if (isFullscreen()) return false;
  const ua = navigator.userAgent;
  const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || isIos();
  const short = Math.min(window.innerWidth, window.innerHeight) < 500;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return mobile || short || coarse;
}
