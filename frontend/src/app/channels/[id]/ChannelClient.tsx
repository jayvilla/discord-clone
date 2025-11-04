"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { getMessages, postMessage } from "@/lib/api";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch historical messages
  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true);
        const data = await getMessages(channelId);
        setMessages(data);
      } catch (err) {
        console.error("Failed to load messages:", err);
        setError("Failed to load messages.");
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, [channelId]);

  // Send message
  const handleSend = async () => {
    if (!content.trim()) return;

    // Optimistic UI: show the message instantly
    const tempMsg: Message = {
      id: Math.random().toString(),
      content,
      user: { username: "You" },
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setContent("");

    try {
      await postMessage(channelId, {
        content,
        userId: "user_cuid_123", // 🔒 TODO: replace with auth
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message.");
    }
  };

  const combinedMessages = [...messages, ...liveMessages];

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && <p className="text-gray-400">Loading messages...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading &&
          combinedMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-neutral-800 p-2 rounded-md break-words"
            >
              <span className="font-bold text-indigo-400">
                {msg.user?.username || "User"}
              </span>
              {": "}
              <span>{msg.content}</span>
            </div>
          ))}
      </div>

      <div className="p-4 bg-neutral-800 flex gap-2 border-t border-neutral-700">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Message #general"
          className="flex-1 bg-neutral-700 p-2 rounded text-white outline-none focus:ring-2 focus:ring-indigo-500"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700 transition"
          disabled={!content.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
