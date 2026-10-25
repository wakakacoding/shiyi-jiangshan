"use client";

import { useAudio } from "@/components/media/audio-provider";
import { CloseIcon, PauseIcon, PlayIcon } from "@/components/ui/icons";

export function AudioDock() {
  const { track, status, visible, toggleTrack, dismiss } = useAudio();
  if (!visible || !track) return null;
  const playing = status === "playing";
  return (
    <div className="audio-dock" role="region" aria-label="背景音乐播放器" data-status={status}>
      <button type="button" className="audio-dock-button" onClick={() => toggleTrack(track)} aria-label={playing ? "暂停背景音乐" : "播放背景音乐"} aria-pressed={playing}>
        {playing ? <PauseIcon width={17} height={17} /> : <PlayIcon width={17} height={17} />}
      </button>
      <div className="audio-dock-info"><strong>{track.title}</strong><span>{track.poemTitle} · {status === "loading" ? "正在加载" : status === "error" ? "加载失败，点击重试" : playing ? "正在播放" : "已暂停"}</span></div>
      {playing ? <span className="audio-wave" aria-hidden="true"><i /><i /><i /></span> : status === "loading" ? <span className="audio-wave" aria-hidden="true"><i /><i /><i /></span> : null}
      <button type="button" className="audio-dock-close" onClick={dismiss} aria-label="暂停并关闭播放器"><CloseIcon width={16} height={16} /></button>
    </div>
  );
}
