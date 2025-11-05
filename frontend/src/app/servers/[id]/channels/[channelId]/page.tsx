"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { getMessages, postMessage } from "@/lib/api";
import { useChatSocket } from "@/hooks/useChatSocket";
import { TypingIndicator } from "@/components/TypingIndicator";
import { motion } from "framer-motion";

export default function ChannelPage() {
  const { channelId } = useParams() as { id: string; channelId: string };
  const userId = "user_dev_001"; // TODO: replace with real auth later
  const username = "Jeff Villa";

  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // ─────────────────────────────
  // Fetch initial messages
  // ─────────────────────────────
  useEffect(() => {
    if (!channelId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getMessages(channelId);
        const items = Array.isArray(data) ? data : data.items;
        setMessages(items.reverse());
        setCursor(data.nextCursor ?? null);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [channelId]);

  // ─────────────────────────────
  // Infinite scroll loader
  // ─────────────────────────────
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
    if (container.scrollTop <= 0) loadOlderMessages();
  }, [loadOlderMessages, loading]);

  // ─────────────────────────────
  // Real-time socket setup
  // ─────────────────────────────
  const { emitTyping, socketRef } = useChatSocket(
    channelId,
    username,
    (msg) => {
      setMessages((prev) => {
        if (msg.socketId && msg.socketId === socketRef.current?.id) return prev;
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, { ...msg, status: "delivered" }];
      });
    },
    (userTyping) => {
      if (!userTyping) return;
      setTypingUsers((prev) => {
        if (!prev.includes(userTyping)) return [...prev, userTyping];
        return prev;
      });
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((n) => n !== userTyping));
      }, 2000);
    }
  );

  // ─────────────────────────────
  // Send message (optimistic UI)
  // ─────────────────────────────
  async function handleSend() {
    if (!input.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      content: input,
      channelId,
      user: { username },
      socketId: socketRef.current?.id,
      status: "sending",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    const pending = input;
    setInput("");
    emitTyping(false);

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);

    try {
      const res = await postMessage(channelId, {
        content: pending,
        userId,
        channelId,
        socketId: socketRef.current?.id,
      });
      const confirmed = res.data || res;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...confirmed, status: "delivered" } : m
        )
      );
    } catch (err) {
      console.error("❌ Failed to send message:", err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    }
  }

  // ─────────────────────────────
  // Auto-scroll to bottom on new message
  // ─────────────────────────────
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
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

        {messages.map((msg, i) => {
          const isMine = msg.user?.username === username;
          const showHeader =
            i === 0 || messages[i - 1].user?.username !== msg.user?.username;

          return (
            <motion.div
              key={msg.id}
              className={`flex flex-col ${
                isMine ? "items-end" : "items-start"
              }`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              {showHeader && !isMine && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-indigo-500/40 rounded-full flex items-center justify-center text-sm text-white">
                    {msg.user?.username?.[0] ?? "?"}
                  </div>
                  <span className="text-sm text-neutral-400">
                    {msg.user?.username || "Unknown"}
                  </span>
                </div>
              )}

              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm ${
                  isMine
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-neutral-800 text-neutral-100 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-wrap break-words leading-snug">
                  {msg.content}
                </p>

                {isMine && (
                  <div className="text-[10px] mt-1 text-right italic">
                    {msg.status === "sending" && (
                      <span className="text-yellow-400">sending...</span>
                    )}
                    {msg.status === "failed" && (
                      <span className="text-red-400">failed</span>
                    )}
                    {msg.status === "delivered" && (
                      <span className="text-green-400">✓ delivered</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Typing Indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Input */}
      <div className="border-t border-neutral-800 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            emitTyping(true);
          }}
          onBlur={() => emitTyping(false)}
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
