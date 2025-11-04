"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/** ✅ Singleton socket initializer */
function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    // Debug logs
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
 * 🎤 Hook for managing live voice channels.
 * Keeps user lists in sync with the backend’s one-channel-at-a-time rule.
 */
export function useVoiceChannel(
  channelId: string,
  userId: string,
  username: string
) {
  const [users, setUsers] = useState<VoiceUser[]>([]);
  const [connected, setConnected] = useState(false);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!channelId || !userId || !username) return;

    const sock = getSocket();
    socketRef.current = sock;

    // ✅ Join voice channel
    const join = () => {
      console.log(`🎤 Joining voice channel ${channelId} as ${username}`);
      sock.emit("joinVoice", { channelId, userId, username });
      setConnected(true);
      setActiveChannel(channelId);
    };

    if (sock.connected) join();
    else sock.once("connect", join);

    // ✅ Handle updates from server
    const handleVoiceUsers = (payload: VoiceUsersPayload) => {
      const { channelId: payloadId, users: payloadUsers } = payload;
      if (payloadId === channelId) {
        setUsers(payloadUsers);
      }

      // 🧠 If we are removed because we joined another channel, clear local state
      const stillInChannel = payloadUsers.some((u) => u.userId === userId);
      if (!stillInChannel && activeChannel === payloadId) {
        console.log(`↩️ Auto-removed from voice channel ${payloadId}`);
        setUsers([]);
        setConnected(false);
        setActiveChannel(null);
      }
    };

    sock.on("voiceUsers", handleVoiceUsers);

    // 🔁 Rejoin after reconnect (only if still active)
    sock.io.on("reconnect", () => {
      if (activeChannel) {
        console.log("🔁 Reconnected — rejoining active voice channel...");
        sock.emit("joinVoice", { channelId: activeChannel, userId, username });
      }
    });

    // 🧹 Cleanup when component unmounts or channel changes
    return () => {
      console.log(`🔇 Leaving voice channel ${channelId}`);
      sock.emit("leaveVoice", { channelId, userId });
      sock.off("voiceUsers", handleVoiceUsers);
      sock.io.off("reconnect");
      setConnected(false);
      setUsers([]);
      setActiveChannel(null);
    };
  }, [channelId, userId, username]);

  /** ✅ Manual leave trigger */
  const leaveChannel = () => {
    if (!socketRef.current || !activeChannel) return;
    console.log(`🔇 Leaving voice channel ${activeChannel}`);
    socketRef.current.emit("leaveVoice", { channelId: activeChannel, userId });
    setActiveChannel(null);
    setUsers([]);
    setConnected(false);
  };

  return { users, connected, activeChannel, leaveChannel };
}
