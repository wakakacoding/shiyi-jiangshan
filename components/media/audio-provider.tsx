"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from "react";
import type { AudioTrack } from "@/lib/types";

export type AudioStatus = "idle" | "loading" | "playing" | "paused" | "error";
type AudioState = { track: AudioTrack | null; status: AudioStatus; visible: boolean };
type AudioAction =
  | { type: "register"; track: AudioTrack }
  | { type: "status"; status: AudioStatus }
  | { type: "show" }
  | { type: "dismiss" };

type AudioContextValue = AudioState & {
  registerTrack: (track: AudioTrack) => void;
  toggleTrack: (track: AudioTrack) => void;
  dismiss: () => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

function reducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case "register": return { ...state, track: action.track, status: "paused" };
    case "status": return { ...state, status: action.status };
    case "show": return { ...state, visible: true };
    case "dismiss": return { ...state, visible: false, status: "paused" };
  }
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { track: null, status: "idle", visible: false });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<AudioTrack | null>(null);

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.preload = "none";
    audio.loop = true;
    audio.volume = 0.72;
    audio.addEventListener("play", () => { dispatch({ type: "show" }); dispatch({ type: "status", status: "playing" }); });
    audio.addEventListener("playing", () => dispatch({ type: "status", status: "playing" }));
    audio.addEventListener("pause", () => dispatch({ type: "status", status: "paused" }));
    audio.addEventListener("waiting", () => dispatch({ type: "status", status: "loading" }));
    audio.addEventListener("error", () => dispatch({ type: "status", status: "error" }));
    audioRef.current = audio;
    return audio;
  }, []);

  useEffect(() => () => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); }
    audioRef.current = null;
    trackRef.current = null;
  }, []);

  const registerTrack = useCallback((track: AudioTrack) => {
    const audio = ensureAudio();
    if (trackRef.current?.src === track.src && audio.getAttribute("src") === track.src) return;
    audio.pause();
    trackRef.current = track;
    audio.src = track.src;
    audio.load();
    dispatch({ type: "register", track });
  }, [ensureAudio]);

  const toggleTrack = useCallback((track: AudioTrack) => {
    if (trackRef.current?.src !== track.src) registerTrack(track);
    const audio = ensureAudio();
    if (!audio.paused) { audio.pause(); return; }
    dispatch({ type: "show" });
    dispatch({ type: "status", status: "loading" });
    void audio.play().catch(() => dispatch({ type: "status", status: "error" }));
  }, [ensureAudio, registerTrack]);

  const dismiss = useCallback(() => {
    audioRef.current?.pause();
    dispatch({ type: "dismiss" });
  }, []);

  return <AudioContext.Provider value={{ ...state, registerTrack, toggleTrack, dismiss }}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio 必须在 AudioProvider 内使用");
  return context;
}
