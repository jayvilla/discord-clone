"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

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

export function useChatSocket(
  channelId: string,
  username: string,
  onNewMessage: (message: any) => void,
  onUserTyping?: (username: string) => void
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!channelId || !username) return;
    const sock = getSocket();
    socketRef.current = sock;

    sock.emit("joinChannel", { channelId, username });
    console.log(`📡 Joined channel ${channelId}`);

    const handleMessage = (msg: any) => {
      // 🧠 Ignore messages sent by this same socket
      if (msg.socketId && msg.socketId === sock.id) return;
      if (msg.channelId === channelId) onNewMessage(msg);
    };

    sock.on("newMessage", handleMessage);

    if (onUserTyping) {
      sock.on("userTyping", (payload) => {
        if (payload.channelId === channelId)
          onUserTyping(payload.username || "Someone");
      });
    }

    return () => {
      sock.emit("leaveChannel", { channelId, username });
      sock.off("newMessage", handleMessage);
      sock.off("userTyping");
    };
  }, [channelId, username, onNewMessage, onUserTyping]);

  const emitTyping = () => {
    socketRef.current?.emit("typing", { channelId, username });
  };

  return { emitTyping, socketRef };
}
