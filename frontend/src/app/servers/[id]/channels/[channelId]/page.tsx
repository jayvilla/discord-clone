"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { getMessages, postMessage } from "@/lib/api";
import { useChatSocket } from "@/hooks/useChatSocket";

export default function ChannelPage() {
  const { channelId } = useParams() as { id: string; channelId: string };
  const username = "Jeff Villa"; // TODO: replace with auth later
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");

  /**
   * 🧭 Fetch initial messages
   */
  useEffect(() => {
    if (!channelId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getMessages(channelId);
        if (Array.isArray(data)) {
          setMessages(data.reverse());
        } else {
          setMessages(data.items.reverse());
          setCursor(data.nextCursor);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [channelId]);

  /**
   * ⬆️ Infinite scroll loader
   */
  const loadOlderMessages = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const older = await getMessages(channelId, cursor);
      const olderItems = Array.isArray(older) ? older : older.items;
      const nextCursor = older.nextCursor ?? null;

      if (olderItems?.length) {
        setMessages((prev) => [...olderItems.reverse(), ...prev]);
        setCursor(nextCursor);
      }
    } catch (err) {
      console.error("Error loading older messages:", err);
    } finally {
      setLoading(false);
    }
  }, [channelId, cursor, loading]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || loading) return;
    if (container.scrollTop <= 0) {
      loadOlderMessages();
    }
  }, [loadOlderMessages, loading]);

  /**
   * 💬 Real-time socket setup
   */
  const { emitTyping, socketRef } = useChatSocket(
    channelId,
    username,
    (msg) => {
      // ✅ Deduplicate and ignore your own socket echoes
      setMessages((prev) => {
        if (msg.socketId && msg.socketId === socketRef.current?.id) return prev;
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, { ...msg, status: "delivered" }];
      });
    },
    (userTyping) => {
      console.debug(`${userTyping} is typing...`);
    }
  );

  /**
   * 🚀 Send message (optimistic with socketId)
   */
  async function handleSend() {
    if (!input.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const clientSocketId = socketRef.current?.id;

    const optimistic = {
      id: tempId,
      content: input,
      channelId,
      user: { username },
      socketId: clientSocketId, // 🧠 used to ignore self-broadcasts
      status: "sending",
    };

    // Show instantly
    setMessages((prev) => [...prev, optimistic]);
    const pending = input;
    setInput("");

    // Scroll down immediately
    setTimeout(() => {
      scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    }, 60);

    try {
      const res = await postMessage(channelId, {
        content: pending,
        userId: "user_dev_001",
        channelId, // 👈 add this line
        socketId: socketRef.current?.id,
      });
      const confirmed = res.data || res;

      // 🟢 Replace temp with delivered
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...confirmed, status: "delivered" } : m
        )
      );
    } catch (err) {
      console.error("❌ Failed to send message:", err);
      // 🔴 Mark failed messages
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    }
  }

  /**
   * 🧠 Debounced auto-scroll
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    }, 80);
    return () => clearTimeout(timeout);
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-white">
      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700"
      >
        {loading && messages.length === 0 && (
          <div className="text-center text-neutral-400 text-sm mt-4">
            Loading messages...
          </div>
        )}

        {cursor && (
          <div className="text-center text-xs text-neutral-500 mb-2">
            Scroll up to load older messages
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-indigo-400">
                {msg.user?.username || "Unknown"}
              </div>
              {/* 🟡 Status bubble */}
              {msg.status === "sending" && (
                <span className="text-xs text-yellow-500 italic">
                  sending...
                </span>
              )}
              {msg.status === "failed" && (
                <span className="text-xs text-red-500 italic">failed</span>
              )}
              {msg.status === "delivered" && (
                <span className="text-xs text-green-500">✓</span>
              )}
            </div>
            <div className="text-sm text-neutral-100">{msg.content}</div>
          </div>
        ))}
      </div>

      {/* Input */}
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
          disabled={!input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
