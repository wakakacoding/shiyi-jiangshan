"use client";

import { useEffect } from "react";
import type { AudioTrack } from "@/lib/types";
import { useAudio } from "@/components/media/audio-provider";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";

export function AudioButton({ track }: { track: AudioTrack }) {
  const { track: currentTrack, status, registerTrack, toggleTrack } = useAudio();
  useEffect(() => registerTrack(track), [registerTrack, track]);
  const active = currentTrack?.src === track.src;
  const currentStatus = active ? status : "idle";
  const playing = active && status === "playing";
  const label = currentStatus === "loading" ? "音乐加载中" : currentStatus === "error" ? "重试播放" : playing ? "暂停背景音乐" : "播放背景音乐";

  return (
    <button type="button" className="detail-audio-button" data-state={currentStatus} onClick={() => toggleTrack(track)} aria-label={`${label}：${track.title}`} aria-pressed={playing}>
      <span className="audio-icon">{playing ? <PauseIcon width={17} height={17} /> : <PlayIcon width={17} height={17} />}</span>
      <span>{label} · {track.title}</span>
    </button>
  );
}
