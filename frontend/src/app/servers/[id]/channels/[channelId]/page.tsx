"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getMessages, postMessage } from "@/lib/api";
import { useChatSocket } from "@/hooks/useChatSocket";

export default function ChannelPage() {
  const params = useParams(); // ✅ Client-side hook
  const channelId = params?.channelId as string;
  const serverId = params?.id as string;

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const username = "Jeff Villa"; // Replace with auth user

  useEffect(() => {
    if (!channelId) return;
    async function loadMessages() {
      const data = await getMessages(channelId);
      setMessages(data);
    }
    loadMessages();
  }, [channelId]);

  const { emitTyping } = useChatSocket(
    channelId,
    username,
    (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    },
    (userTyping) => {
      if (userTyping !== username) {
        setTypingUser(userTyping);
        setTimeout(() => setTypingUser(null), 1500);
      }
    }
  );

  async function handleSend() {
    if (!input.trim()) return;
    const newMsg = await postMessage(channelId, {
      content: input,
      userId: "user_dev_001",
    });
    setInput("");
    setMessages((prev) => [...prev, newMsg]);
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-white">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1">
            <div className="font-semibold text-indigo-400">
              {msg.user?.username || "Unknown"}
            </div>
            <div className="text-sm text-neutral-100">{msg.content}</div>
          </div>
        ))}
      </div>

      {typingUser && (
        <div className="px-4 text-xs text-neutral-400 italic">
          {typingUser} is typing...
        </div>
      )}

      <div className="border-t border-neutral-800 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            emitTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Send a message..."
          className="flex-1 bg-neutral-800 rounded-md px-3 py-2 outline-none text-sm"
        />
        <button
          onClick={handleSend}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
}
