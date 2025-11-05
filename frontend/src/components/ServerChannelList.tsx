// components/ServerChannelList.tsx
"use client";

import { useEffect, useState } from "react";
import { getServerById } from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Volume2, Hash } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  type: "TEXT" | "VOICE";
}

export function ServerChannelList({ serverId }: { serverId: string }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    if (!serverId) return;
    (async () => {
      try {
        const server = await getServerById(serverId);
        setChannels(server.channels || []);
      } catch (err) {
        console.error("Failed to fetch channels:", err);
      }
    })();
  }, [serverId]);

  const textChannels = channels.filter((c) => c.type === "TEXT");
  const voiceChannels = channels.filter((c) => c.type === "VOICE");

  return (
    <div className="w-60 bg-neutral-850 border-r border-neutral-800 flex flex-col p-3 space-y-5">
      {/* TEXT */}
      <div>
        <h2 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
          Text Channels
        </h2>
        <div className="space-y-1">
          {textChannels.map((ch) => {
            const active = pathname.includes(ch.id);
            return (
              <Link
                key={ch.id}
                href={`/servers/${serverId}/channels/${ch.id}`}
                className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm transition ${
                  active
                    ? "bg-neutral-700 text-white"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <Hash size={14} /> {ch.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* VOICE */}
      <div>
        <h2 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
          Voice Channels
        </h2>
        <div className="space-y-1">
          {voiceChannels.map((ch) => {
            const active = pathname.includes(ch.id);
            return (
              <Link
                key={ch.id}
                href={`/servers/${serverId}/channels/${ch.id}`}
                className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm transition ${
                  active
                    ? "bg-neutral-700 text-white"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <Volume2 size={14} /> {ch.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
