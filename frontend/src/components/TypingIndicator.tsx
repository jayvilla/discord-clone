"use client";

interface TypingIndicatorProps {
  typingUsers: string[];
}

/**
 * ✍️ Displays "Jeff is typing..." or "Jeff, Anna are typing..."
 * Renders nothing if no one is typing.
 */
export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const names =
    typingUsers.length > 2
      ? `${typingUsers.slice(0, 2).join(", ")} and others`
      : typingUsers.join(", ");

  return (
    <div className="px-4 py-1 text-xs text-neutral-400 italic">
      {names} {typingUsers.length > 1 ? "are" : "is"} typing...
    </div>
  );
}
