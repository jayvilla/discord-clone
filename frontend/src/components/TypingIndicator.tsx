"use client";

import { motion, AnimatePresence } from "framer-motion";

interface TypingIndicatorProps {
  typingUsers: string[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const names =
    typingUsers.length > 2
      ? `${typingUsers.slice(0, 2).join(", ")} and others`
      : typingUsers.join(", ");

  return (
    <AnimatePresence>
      <motion.div
        key="typing"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-2 text-xs text-neutral-400 flex items-center gap-2 italic"
      >
        <span>
          {names} {typingUsers.length > 1 ? "are" : "is"} typing
        </span>
        <div className="flex gap-1 ml-1">
          <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse"></span>
          <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse delay-150"></span>
          <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse delay-300"></span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
