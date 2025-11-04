"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/** ✅ Singleton socket initializer (ensures only one socket across app) */
function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    // Optional debug logging
    socket.on("connect", () =>
      console.log(`🎧 Connected to voice gateway (${socket?.id})`)
    );
    socket.on("disconnect", (reason) =>
      console.log(`🔌 Disconnected from voice gateway: ${reason}`)
    );
    socket.on("connect_error", (err) =>
      console.error("❌ Voice socket connection error:", err.message)
    );
  }
  return socket;
}

interface VoiceUser {
  userId: string;
  username: string;
}

interface VoiceUsersPayload {
  channelId: string;
  users: VoiceUser[];
}

/**
 * 🎤 React hook for managing live voice channel participants.
 * Handles joining, leaving, reconnection, and live user updates.
 */
export function useVoiceChannel(
  channelId: string,
  userId: string,
  username: string
) {
  const [users, setUsers] = useState<VoiceUser[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!channelId || !userId || !username) return;

    const sock = getSocket();
    socketRef.current = sock;

    // Join channel once connected
    const join = () => {
      console.log(`🎤 Joining voice channel ${channelId} as ${username}`);
      sock.emit("joinVoice", { channelId, userId, username });
      setConnected(true);
    };

    if (sock.connected) join();
    else sock.once("connect", join);

    // Handle updated user lists
    const handleVoiceUsers = (payload: VoiceUsersPayload) => {
      if (payload.channelId === channelId) {
        setUsers(payload.users);
      }
    };
    sock.on("voiceUsers", handleVoiceUsers);

    // Auto-rejoin after reconnect
    sock.io.on("reconnect", () => {
      console.log("🔁 Voice socket reconnected — rejoining channel...");
      sock.emit("joinVoice", { channelId, userId, username });
    });

    // Cleanup
    return () => {
      console.log(`🔇 Leaving voice channel ${channelId}`);
      sock.emit("leaveVoice", { channelId, userId });
      sock.off("voiceUsers", handleVoiceUsers);
      sock.io.off("reconnect");
      setConnected(false);
    };
  }, [channelId, userId, username]);

  return { users, connected };
}
