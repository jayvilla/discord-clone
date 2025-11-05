"use client";

import { useEffect, useRef, useState } from "react";
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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Fetch messages on mount
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

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, liveMessages]);

  // Send a message
  const handleSend = async () => {
    if (!content.trim()) return;

    const optimisticMessage: Message = {
      id: Math.random().toString(),
      content,
      user: { username: "You" },
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setContent("");

    try {
      setSending(true);
      await postMessage(channelId, {
        content,
        userId: "user_dev_001", // replace with auth user later
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // Combine DB + live socket messages
  const combinedMessages = [...messages, ...liveMessages];

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white">
      {/* Messages area */}
      <div
        ref={scrollRef}
        id="chat-scroll"
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
      >
        {loading && <p className="text-neutral-500">Loading messages...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading &&
          combinedMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-neutral-800 p-3 rounded-lg shadow-sm hover:bg-neutral-750 transition-all"
            >
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-indigo-400">
                  {msg.user?.username || "User"}
                </span>
                <span className="text-xs text-neutral-500">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-1 text-neutral-200 break-words">{msg.content}</p>
            </div>
          ))}
      </div>

      {/* Message input */}
      <div className="p-4 bg-neutral-850 border-t border-neutral-800 flex gap-2 items-center">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={sending ? "Sending..." : "Message #general"}
          disabled={sending}
          className="flex-1 bg-neutral-800 p-3 rounded-md text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-indigo-600 transition"
        />
        <button
          onClick={handleSend}
          disabled={sending || !content.trim()}
          className={`px-5 py-2 rounded-md font-semibold transition ${
            sending || !content.trim()
              ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
