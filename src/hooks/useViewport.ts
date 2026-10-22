import { useEffect, useState } from 'react';

export interface ViewportInfo {
  width: number;
  height: number;
  isPortrait: boolean;
  /** Coarse pointer (finger) device */
  isTouch: boolean;
  /** Phone-sized: shorter side < 600px */
  isPhone: boolean;
  /** Phone held sideways: landscape with height <= 500px */
  isShortLandscape: boolean;
}

function readViewport(): ViewportInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouch =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const isPortrait = height > width;
  return {
    width,
    height,
    isPortrait,
    isTouch,
    isPhone: Math.min(width, height) < 600,
    isShortLandscape: !isPortrait && height <= 500,
  };
}

/** Live viewport size / orientation (updates on resize, rotation and iOS toolbar changes). */
export function useViewport(): ViewportInfo {
  const [info, setInfo] = useState<ViewportInfo>(() => readViewport());

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setInfo(readViewport()));
    };
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.visualViewport?.addEventListener('resize', update);
    // iOS reports the new size slightly after orientationchange
    const late = () => setTimeout(update, 350);
    window.addEventListener('orientationchange', late);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('orientationchange', late);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return info;
}

/** Fullscreen helpers (Android / desktop; iPhone Safari does not support element fullscreen). */
export function isFullscreenSupported(): boolean {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
  };
  return Boolean(el.requestFullscreen || el.webkitRequestFullscreen);
}

export function isFullscreenActive(): boolean {
  const doc = document as Document & { webkitFullscreenElement?: Element };
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}

export async function toggleFullscreen(): Promise<void> {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
  };
  const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> };
  try {
    if (isFullscreenActive()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    } else if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: 'hide' });
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    }
  } catch {
    // user gesture missing or not allowed — ignore
  }
}

/** Try to natively lock the screen orientation (only works in fullscreen on Android Chrome). */
export async function tryLockOrientation(mode: 'landscape' | 'any'): Promise<boolean> {
  const orientation = screen.orientation as ScreenOrientation & {
    lock?: (o: string) => Promise<void>;
    unlock?: () => void;
  };
  if (!orientation) return false;
  try {
    if (mode === 'any') {
      orientation.unlock?.();
      return true;
    }
    if (!isFullscreenActive() || !orientation.lock) return false;
    await orientation.lock('landscape');
    return true;
  } catch {
    return false;
  }
}
