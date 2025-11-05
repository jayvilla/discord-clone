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
  // UI — Discord style
  // ─────────────────────────────
  return (
    <div className="flex flex-col h-full bg-discord-primary text-discord-text-primary">
      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-[var(--scrollbar-thumb)] scrollbar-track-[var(--scrollbar-bg)]"
      >
        {loading && messages.length === 0 && (
          <div className="text-center text-discord-text-muted text-sm mt-4">
            Loading messages...
          </div>
        )}

        {cursor && (
          <div className="text-center text-[12px] text-discord-text-muted mb-3">
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
              className="group flex items-start gap-3 py-[2px] px-2 rounded-md message-hover"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Avatar */}
              {showHeader ? (
                <div className="w-10 h-10 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center text-neutral-300 text-sm font-semibold">
                    {msg.user?.username?.[0] ?? "?"}
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 flex-shrink-0" />
              )}

              {/* Message content */}
              <div className="flex flex-col min-w-0">
                {showHeader && (
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-medium ${
                        isMine
                          ? "text-discord-accent"
                          : "text-discord-text-primary"
                      }`}
                    >
                      {msg.user?.username || "Unknown"}
                    </span>
                    <span className="text-[11px] text-discord-text-muted">
                      {new Date(msg.createdAt ?? Date.now()).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                )}

                <p
                  className={`text-[15px] leading-snug text-discord-text-primary/90 break-words whitespace-pre-wrap ${
                    !showHeader ? "ml-[52px]" : ""
                  }`}
                >
                  {msg.content}
                </p>

                {/* Status (only for your messages) */}
                {isMine && (
                  <div className="text-[11px] text-discord-text-muted italic ml-[52px]">
                    {msg.status === "sending" && "sending..."}
                    {msg.status === "failed" && "failed"}
                    {msg.status === "delivered" && "✓ delivered"}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Typing Indicator */}
      <div className="px-4">
        <TypingIndicator typingUsers={typingUsers} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border-color)] p-3 flex gap-2 bg-discord-secondary">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            emitTyping(true);
          }}
          onBlur={() => emitTyping(false)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Message #general"
          className="flex-1 bg-discord-tertiary rounded-md px-3 py-2 outline-none text-[15px] text-discord-text-primary placeholder-discord-text-muted focus:ring-1 focus:ring-discord-accent"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-discord-accent hover:bg-indigo-600 px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
