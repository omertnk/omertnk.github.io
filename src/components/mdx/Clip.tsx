"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Play, RotateCcw } from "lucide-react";

/**
 * GIF gibi oynayan sessiz klip. Tıklayınca durur, tekrar tıklayınca devam eder.
 * Figure tarafından yerel mp4/webm için kullanılır.
 */
export function Clip({ src, label, poster }: { src: string; label?: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const visible = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const play = useCallback((video: HTMLVideoElement) => {
    void video.play().catch((error: unknown) => {
      // Scrolling away can interrupt a pending play request. A blocked autoplay
      // instead leaves the play button available for an explicit user gesture.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setLoading(false);
      setPlaying(false);
    });
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const updatePlayback = () => {
      if (visible.current && !document.hidden && !userPaused.current) {
        if (video.getAttribute("src")) play(video);
      } else {
        video.pause();
      }
    };
    const load = () => {
      if (video.getAttribute("src") === src) return;
      video.src = src;
      video.load();
      updatePlayback();
    };

    // No src in the initial HTML: even metadata requests wait until the clip
    // approaches the viewport. Autoplay would override preload="metadata".
    const preloadObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        load();
        preloadObserver.disconnect();
      }
    }, { rootMargin: "400px 0px" });
    const playbackObserver = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      updatePlayback();
    });

    preloadObserver.observe(video);
    playbackObserver.observe(video);
    document.addEventListener("visibilitychange", updatePlayback);
    return () => {
      preloadObserver.disconnect();
      playbackObserver.disconnect();
      document.removeEventListener("visibilitychange", updatePlayback);
      video.pause();
    };
  }, [src, play]);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (!video.paused && !failed) {
      userPaused.current = true;
      video.pause();
      return;
    }
    userPaused.current = false;
    if (failed || !video.getAttribute("src")) {
      setFailed(false);
      video.src = src;
      video.load();
    }
    setLoading(true);
    play(video);
  };

  const action = failed ? "Retry clip" : playing ? "Pause clip" : "Play clip";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label ? `${action}: ${label}` : action}
      title={action}
      className="group relative block aspect-video w-full cursor-pointer overflow-hidden rounded-[10px] border border-border bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <video
        ref={ref}
        poster={poster}
        loop
        muted
        playsInline
        preload="metadata"
        onLoadStart={() => setLoading(true)}
        onLoadedData={() => setLoading(false)}
        onPlaying={() => { setPlaying(true); setLoading(false); setFailed(false); }}
        onPause={() => { setPlaying(false); setLoading(false); }}
        onWaiting={() => { setPlaying(false); setLoading(true); }}
        onError={() => { setFailed(true); setLoading(false); setPlaying(false); }}
        aria-label={label}
        className="!mt-0 block h-full w-full object-contain !rounded-none !border-0"
      >
        Your browser does not support video playback.
      </video>
      {!playing && (
        <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2" role="status">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/80 text-foreground shadow-lg backdrop-blur">
            {failed ? <RotateCcw size={24} /> : loading ? <LoaderCircle size={24} className="animate-spin motion-reduce:animate-none" /> : <Play size={24} className="ml-0.5" />}
          </span>
          {(failed || loading) && <span className="rounded bg-background/90 px-2 py-1 text-xs text-foreground">{failed ? "Video could not load. Click to retry." : "Loading video…"}</span>}
        </span>
      )}
    </button>
  );
}
