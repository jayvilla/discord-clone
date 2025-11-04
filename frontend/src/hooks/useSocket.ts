import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";

export const useSocket = (channelId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    // Join this channel room
    if (channelId) {
      s.emit("joinChannel", { channelId });
    }

    // Listen for messages from backend
    s.on("newMessage", (msg) => {
      if (msg.channelId === channelId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      s.off("newMessage");
      if (channelId) s.emit("leaveChannel", { channelId });
      s.disconnect();
    };
  }, [channelId]);

  return { socket, messages };
};
