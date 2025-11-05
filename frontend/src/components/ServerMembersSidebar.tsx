"use client";

import { useEffect, useState, useMemo } from "react";
import { getServerUsers } from "@/lib/api";

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

  const statusFor = (i: number) =>
    i % 5 === 0
      ? "idle"
      : i % 7 === 0
      ? "dnd"
      : i % 3 === 0
      ? "offline"
      : "online";

  const statusColor = (s: string) =>
    s === "online"
      ? "bg-emerald-500"
      : s === "idle"
      ? "bg-amber-400"
      : s === "dnd"
      ? "bg-rose-500"
      : "bg-neutral-600";

  const [online, offline] = useMemo(() => {
    const onlineMembers = members.filter((_, i) => statusFor(i) !== "offline");
    const offlineMembers = members.filter((_, i) => statusFor(i) === "offline");
    return [onlineMembers, offlineMembers];
  }, [members]);

  return (
    <aside className="member-sidebar">
      <h3 className="channel-header flex justify-between items-center mb-2">
        <span>Members</span>
        <span className="text-[11px] text-discord-text-muted">
          {loading ? "…" : members.length}
        </span>
      </h3>

      {loading ? (
        <div className="text-discord-text-muted text-sm">Loading members…</div>
      ) : members.length === 0 ? (
        <div className="text-discord-text-muted text-sm italic">No members</div>
      ) : (
        <div className="space-y-4">
          {/* ONLINE */}
          <div>
            <h4 className="text-[11px] uppercase tracking-wide text-discord-text-muted mb-1 px-1">
              Online — {online.length}
            </h4>
            <ul className="space-y-[2px]">
              {online.map((m, idx) => {
                const status = statusFor(idx);
                return (
                  <li
                    key={m.id}
                    className="member-item group hover:bg-discord-hover/70 relative"
                  >
                    {/* Avatar + Status Dot */}
                    <div className="relative w-8 h-8 flex-shrink-0">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-neutral-300 font-medium">
                          {m.username?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-secondary)] ${statusColor(
                          status
                        )}`}
                      ></span>
                    </div>

                    {/* Username + Status */}
                    <div className="flex-1 truncate ml-2">
                      <div className="text-sm text-discord-text-primary truncate">
                        {m.username}
                      </div>
                      <div className="text-[11px] text-discord-text-muted">
                        {status === "idle"
                          ? "Idle"
                          : status === "dnd"
                          ? "Do Not Disturb"
                          : "Online"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* OFFLINE */}
          {offline.length > 0 && (
            <div>
              <h4 className="text-[11px] uppercase tracking-wide text-discord-text-muted mb-1 px-1">
                Offline — {offline.length}
              </h4>
              <ul className="space-y-[2px]">
                {offline.map((m) => (
                  <li
                    key={m.id}
                    className="member-item hover:bg-discord-hover/70 relative opacity-60"
                  >
                    <div className="relative w-8 h-8 flex-shrink-0">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-neutral-300 font-medium">
                          {m.username?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-secondary)] bg-neutral-600"></span>
                    </div>

                    <div className="flex-1 truncate ml-2">
                      <div className="text-sm text-discord-text-muted truncate">
                        {m.username}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
