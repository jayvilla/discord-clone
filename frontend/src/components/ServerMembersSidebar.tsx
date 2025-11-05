// components/ServerMembersSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { getServerUsers } from "@/lib/api";
import { Circle } from "lucide-react";

type Member = { id: string; username: string; avatarUrl?: string | null };

export default function ServerMembersSidebar({
  serverId,
}: {
  serverId: string;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const users = await getServerUsers(serverId);
        if (alive) setMembers(users);
      } catch (e) {
        console.error("Failed to load members:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [serverId]);

  // Fake presence for now (cycle statuses for some color)
  const statusFor = (i: number) =>
    i % 5 === 0 ? "idle" : i % 7 === 0 ? "dnd" : "online";
  const statusColor = (s: string) =>
    s === "online"
      ? "text-emerald-400"
      : s === "idle"
      ? "text-amber-400"
      : "text-rose-500";

  return (
    <aside className="w-64 bg-neutral-850 border-l border-neutral-800 p-3 overflow-y-auto">
      <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-3">
        Members — {loading ? "…" : members.length}
      </h3>

      {loading ? (
        <div className="text-neutral-500 text-sm">Loading members…</div>
      ) : members.length === 0 ? (
        <div className="text-neutral-500 text-sm italic">No members</div>
      ) : (
        <ul className="space-y-2">
          {members.map((m, idx) => {
            const status = statusFor(idx);
            return (
              <li
                key={m.id}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-neutral-800/60"
              >
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt={m.username}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-xs">
                    {m.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex-1 truncate">
                  <div className="text-sm text-neutral-200 truncate">
                    {m.username}
                  </div>
                </div>
                <Circle size={10} className={statusColor(status)} />
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
