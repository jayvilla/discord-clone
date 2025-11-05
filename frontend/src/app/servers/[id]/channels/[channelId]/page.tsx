"use client";

import { use } from "react"; // 👈 allows unwrapping async params
import { useEffect, useState } from "react";
import { getMessages, postMessage } from "@/lib/api";

export default function ChannelPage({
  params,
}: {
  params: Promise<{ id: string; channelId: string }>;
}) {
  // ✅ unwrap async params safely
  const { id: serverId, channelId } = use(params);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!channelId) return;

    (async () => {
      try {
        const msgs = await getMessages(channelId);
        setMessages(msgs);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    })();
  }, [channelId]);

  async function handleSend() {
    if (!input.trim()) return;
    const newMsg = await postMessage(channelId, {
      content: input,
      userId: "user_cuid_123",
    });
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="text-sm text-neutral-300">
            <span className="font-semibold text-indigo-400">
              {m.user?.username || "Unknown"}
            </span>
            : {m.content}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-neutral-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Message #channel"
          className="flex-1 bg-neutral-800 rounded px-3 py-2 text-sm text-white outline-none"
        />
        <button
          onClick={handleSend}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
