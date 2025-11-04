"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSocket } from "@/hooks/useSocket";

interface Message {
  id: string;
  content: string;
  user: { username: string };
  createdAt: string;
}

export default function ChannelClient({ channelId }: { channelId: string }) {
  const { messages: liveMessages } = useSocket(channelId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/channels/${channelId}/messages`)
      .then((res) => setMessages(res.data));
  }, [channelId]);

  const handleSend = async () => {
    if (!content.trim()) return;
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/channels/${channelId}/messages`,
      {
        content,
        userId: "user_cuid_123",
      }
    );
    setContent("");
  };

  const combinedMessages = [...messages, ...liveMessages];

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {combinedMessages.map((msg) => (
          <div key={msg.id} className="bg-neutral-800 p-2 rounded-md">
            <span className="font-bold">{msg.user?.username || "User"}: </span>
            {msg.content}
          </div>
        ))}
      </div>

      <div className="p-4 bg-neutral-800 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Message #general"
          className="flex-1 bg-neutral-700 p-2 rounded text-white outline-none"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
