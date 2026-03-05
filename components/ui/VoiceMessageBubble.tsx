'use client';

import { useEffect, useRef, useState } from 'react';

interface VoiceMessageBubbleProps {
  src: string;
  isSelf: boolean; // 是否是自己发的（决定颜色方向）
}

export function VoiceMessageBubble({ src, isSelf }: VoiceMessageBubbleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (isFinite(audio.duration)) setDuration(Math.round(audio.duration));
    };
    audio.ontimeupdate = () => setCurrentTime(Math.round(audio.currentTime));
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const displaySecs = isPlaying ? currentTime : duration;
  // 根据时长动态宽度：最短 80px，最长 180px
  const bubbleWidth = Math.min(180, Math.max(80, 80 + duration * 2));

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-2xl select-none transition-opacity hover:opacity-80 active:opacity-60`}
      style={{ width: bubbleWidth, minWidth: 80 }}
      title={isPlaying ? '暂停' : '播放语音'}
    >
      {isSelf ? (
        // 自己发的：秒数在左，波浪在右
        <>
          <span className="text-xs font-mono tabular-nums opacity-90">
            {displaySecs}″
          </span>
          <WaveIcon isPlaying={isPlaying} />
        </>
      ) : (
        // 对方发的：波浪在左，秒数在右
        <>
          <WaveIcon isPlaying={isPlaying} />
          <span className="text-xs font-mono tabular-nums opacity-90 ml-auto">
            {displaySecs}″
          </span>
        </>
      )}
    </button>
  );
}

function WaveIcon({ isPlaying }: { isPlaying: boolean }) {
  return (
    <span className="flex items-end gap-[2px] h-4">
      {[3, 5, 7, 5, 3].map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-current transition-all ${
            isPlaying ? 'animate-pulse' : 'opacity-50'
          }`}
          style={{
            height: isPlaying ? `${h}px` : '3px',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </span>
  );
}
