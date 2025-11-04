"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function useSocket(channelId?: string) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");
    }

    if (channelId) {
      socket.emit("joinChannel", { channelId });
      console.log("Joined channel:", channelId);
    }

    socket.on("newMessage", (msg) => {
      if (msg.channelId === channelId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket?.off("newMessage");
    };
  }, [channelId]);

  return { socket, messages };
}
