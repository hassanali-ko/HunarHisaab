"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Pulls the server tree again on an interval, so a customer confirming on
 * their own phone shows up here without anyone reloading.
 *
 * It deliberately does not check document.visibilityState. Some embedded and
 * mirrored browsers report a foreground tab as hidden, and the one moment
 * this needs to work is the moment someone is watching.
 */
export function AutoRefresh({ seconds = 4 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => router.refresh();
    const id = setInterval(tick, seconds * 1000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, seconds]);

  return null;
}
