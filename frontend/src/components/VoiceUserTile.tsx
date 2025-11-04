"use client";

import { useEffect, useRef, useState } from "react";

interface VoiceUserTileProps {
  username: string;
  stream: MediaStream;
  isLocal?: boolean;
}

/**
 * 🎤 Renders a user’s voice avatar tile with glow when talking.
 */
export function VoiceUserTile({
  username,
  stream,
  isLocal,
}: VoiceUserTileProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!stream) return;

    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.srcObject = stream;
      audioEl.muted = isLocal; // 🔇 prevent echo for self
      audioEl.play().catch(() => {});
    }

    // Setup audio analysis
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 512;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    let lastSpeaking = false;
    const detect = () => {
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const isSpeaking = volume > 20; // sensitivity threshold
      if (isSpeaking !== lastSpeaking) {
        setSpeaking(isSpeaking);
        lastSpeaking = isSpeaking;
      }
      requestAnimationFrame(detect);
    };
    detect();

    return () => {
      audioContext.close();
    };
  }, [stream]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all ${
        speaking
          ? "ring-4 ring-indigo-500 shadow-lg scale-105"
          : "ring-2 ring-neutral-700"
      }`}
    >
      {/* Placeholder avatar */}
      <div className="w-12 h-12 rounded-full bg-neutral-600 flex items-center justify-center font-bold text-white">
        {username.charAt(0).toUpperCase()}
      </div>
      <span className="text-xs mt-1 text-neutral-400 truncate w-full text-center">
        {isLocal ? `${username} (You)` : username}
      </span>
      <audio ref={audioRef} autoPlay />
    </div>
  );
}
