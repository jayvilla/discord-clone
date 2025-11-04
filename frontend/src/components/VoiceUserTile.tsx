"use client";

import { useEffect, useRef, useState } from "react";

interface VoiceUserTileProps {
  username: string;
  stream?: MediaStream;
  isSpeaking?: boolean;
  isLocal?: boolean;
}

/**
 * 🧩 VoiceUserTile
 * Displays a user’s avatar, live voice visualization, and glow ring if speaking.
 */
export function VoiceUserTile({
  username,
  stream,
  isSpeaking = false,
  isLocal = false,
}: VoiceUserTileProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    if (!stream || !audioRef.current) return;

    // Attach stream to the <audio> element
    audioRef.current.srcObject = stream;
    audioRef.current.muted = isLocal; // Mute local mic playback
    audioRef.current.play().catch(() => {});

    // ✅ Ensure the stream has audio before analyzing
    if (stream.getAudioTracks().length === 0) {
      console.warn(`⚠️ ${username}'s stream has no audio track yet`);
      setHasAudio(false);
      return;
    } else {
      setHasAudio(true);
    }

    // 🎧 Audio analysis for dynamic glow
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setVolumeLevel(avg);
      requestAnimationFrame(tick);
    };

    tick();

    return () => {
      audioContext.close().catch(() => {});
    };
  }, [stream, username, isLocal]);

  // 🎤 Glow conditions
  const isActive = isSpeaking || volumeLevel > 35;

  return (
    <div className="flex flex-col items-center justify-center w-20 text-center select-none">
      <div
        className={`relative w-14 h-14 flex items-center justify-center rounded-full font-semibold text-white transition-all duration-200
          ${
            isActive
              ? "bg-indigo-600 ring-4 ring-indigo-400 animate-glow"
              : "bg-neutral-700"
          }
          ${!hasAudio ? "opacity-60" : ""}
        `}
      >
        {username.charAt(0).toUpperCase()}
      </div>
      <div className="text-xs mt-1 text-neutral-300 truncate w-full">
        {username}
      </div>
      <audio ref={audioRef} autoPlay playsInline />
    </div>
  );
}
