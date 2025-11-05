"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// Singleton socket initializer
function getSocket(): Socket {
  if (!socket) {
    socket = io(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      transports: ["websocket"],
      reconnection: true,
    });

    socket.on("connect", () =>
      console.log(`💬 Connected to chat gateway (${socket.id})`)
    );
  }
  return socket;
}

interface UseChatSocketOptions {
  channelId: string;
  userId: string;
  username: string;
  onNewMessage: (message: any) => void;
  onUserTyping?: (username: string, isTyping: boolean) => void;
}

/**
 * 🧠 useChatSocket
 * Handles joining/leaving channels, new message events, and typing indicators.
 */
export function useChatSocket({
  channelId,
  userId,
  username,
  onNewMessage,
  onUserTyping,
}: UseChatSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!channelId || !userId || !username) return;

    const sock = getSocket();
    socketRef.current = sock;

    // Join this channel
    sock.emit("channel:join", { channelId, userId, username });
    console.log(`📡 Joined chat channel ${channelId}`);

    // Handle new messages
    const handleMessage = (msg: any) => {
      // Ignore messages from this socket
      if (msg.socketId && msg.socketId === sock.id) return;
      if (msg.channelId === channelId) onNewMessage(msg);
    };
    sock.on("message:new", handleMessage);

    // Handle typing indicator updates
    if (onUserTyping) {
      sock.on("user:typing", (payload) => {
        if (payload.userId !== userId && payload.isTyping) {
          onUserTyping(payload.username || "Someone", payload.isTyping);
        }
      });
    }

    return () => {
      sock.emit("channel:leave", { channelId, userId, username });
      sock.off("message:new", handleMessage);
      sock.off("user:typing");
      console.log(`📴 Left chat channel ${channelId}`);
    };
  }, [channelId, userId, username, onNewMessage, onUserTyping]);

  /**
   * 💬 Emit a new message to the server
   */
  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    socketRef.current?.emit("message:send", {
      channelId,
      content,
      userId,
      username,
    });
  };

  /**
   * 🧠 Emit typing indicator (debounced on frontend)
   */
  const emitTyping = (isTyping = true) => {
    socketRef.current?.emit("message:typing", {
      channelId,
      userId,
      username,
      isTyping,
    });
  };

  return { sendMessage, emitTyping, socketRef };
}
