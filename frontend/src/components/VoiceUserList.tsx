"use client";

import { VoiceUserTile } from "@/components/VoiceUserTile";
import { Volume2 } from "lucide-react";

interface VoiceUserListProps {
  localStream?: MediaStream | null;
  peers: { id: string; stream: MediaStream; username: string }[];
  username: string;
  activeSpeakers: string[];
}

/**
 * 🎧 Displays all active users in a voice channel (Discord-style)
 * Shows avatars, glow ring when speaking, and total count.
 */
export function VoiceUserList({
  localStream,
  peers,
  username,
  activeSpeakers,
}: VoiceUserListProps) {
  // Combine local + remote users
  const allUsers = [
    ...(localStream ? [{ username, stream: localStream, isLocal: true }] : []),
    ...peers.map((p) => ({
      username: p.username,
      stream: p.stream,
      isLocal: false,
    })),
  ];

  if (allUsers.length === 0)
    return (
      <div className="flex items-center justify-center text-neutral-500 italic py-4">
        No active users in voice.
      </div>
    );

  return (
    <div className="flex flex-col bg-neutral-850 p-3 rounded-lg border border-neutral-700/50 shadow-md w-full max-w-md">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 text-neutral-300 text-sm font-semibold uppercase tracking-wide">
        <Volume2 size={14} className="text-indigo-400" />
        <span>
          {allUsers.length} Active {allUsers.length === 1 ? "User" : "Users"}
        </span>
      </div>

      {/* Voice user grid */}
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-4 place-items-center">
        {allUsers.map((user, i) => (
          <VoiceUserTile
            key={`${user.username}-${i}`}
            username={user.username}
            stream={user.stream}
            isSpeaking={activeSpeakers.includes(user.username)}
          />
        ))}
      </div>
    </div>
  );
}
