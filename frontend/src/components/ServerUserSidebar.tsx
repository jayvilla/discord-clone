// components/ServerUserSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { getServerUsers } from "@/lib/api";

export default function ServerUserSidebar({ serverId }: { serverId: string }) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getServerUsers(serverId);
      setUsers(data);
    })();
  }, [serverId]);

  return (
    <div className="w-64 bg-neutral-850 border-l border-neutral-800 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800 text-neutral-400 text-sm uppercase font-semibold">
        <Users size={14} />
        Online — {users.length}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-3 px-2 py-2 rounded hover:bg-neutral-800/60 transition"
          >
            <img
              src={u.avatarUrl || "/default-avatar.png"}
              className="w-9 h-9 rounded-full"
              alt=""
            />
            <span className="text-sm text-neutral-200 truncate">
              {u.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
