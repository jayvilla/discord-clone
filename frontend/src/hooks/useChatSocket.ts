"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * 🧩 Create or reuse a single socket connection for all chat features
 */
function getSocket(): Socket {
  if (!socket) {
    socket = io(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log(`💬 Connected to chat gateway (${socket.id})`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Chat socket disconnected: ${reason}`);
    });

    socket.on("connect_error", (err) => {
      console.error("⚠️ Chat socket error:", err.message);
    });
  }

  return socket;
}

interface ChatMessage {
  id: string;
  content: string;
  channelId: string;
  user: {
    id: string;
    username: string;
  };
  createdAt?: string;
}

/**
 * 🔌 Hook for joining a chat channel, listening for messages, and emitting typing signals
 */
export function useChatSocket(
  channelId: string,
  username: string,
  onNewMessage: (message: ChatMessage) => void,
  onUserTyping?: (username: string) => void
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!channelId || !username) return;

    const sock = getSocket();
    socketRef.current = sock;

    // ✅ Join channel room
    sock.emit("joinChannel", { channelId, username });
    console.log(`📡 Joined channel room: ${channelId}`);

    // ✅ Listen for new messages
    const handleMessage = (msg: ChatMessage) => {
      if (msg.channelId === channelId) onNewMessage(msg);
    };

    sock.on("newMessage", handleMessage);

    // ✅ Listen for typing notifications
    const handleTyping = (payload: { channelId: string; username: string }) => {
      if (payload.channelId === channelId && onUserTyping)
        onUserTyping(payload.username);
    };

    sock.on("userTyping", handleTyping);

    // 🧹 Cleanup
    return () => {
      sock.emit("leaveChannel", { channelId, username });
      sock.off("newMessage", handleMessage);
      sock.off("userTyping", handleTyping);
    };
  }, [channelId, username, onNewMessage, onUserTyping]);

  /** ✍️ Emit typing signal */
  const emitTyping = () => {
    socketRef.current?.emit("typing", { channelId, username });
  };

  return { emitTyping };
}
