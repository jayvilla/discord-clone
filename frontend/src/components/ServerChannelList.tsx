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
    <aside className="channel-sidebar flex flex-col justify-between h-full">
      <div className="overflow-y-auto space-y-5 p-3">
        {/* TEXT CHANNELS */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wide text-discord-text-muted mb-2 px-2">
            Text Channels
          </h2>
          <div className="flex flex-col gap-[2px]">
            {textChannels.map((ch) => {
              const active = pathname.includes(ch.id);
              return (
                <Link
                  key={ch.id}
                  href={`/servers/${serverId}/channels/${ch.id}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[15px] transition-colors
                    ${
                      active
                        ? "bg-discord-hover text-discord-text-primary font-medium"
                        : "text-discord-text-secondary hover:bg-discord-hover hover:text-white"
                    }`}
                >
                  <Hash
                    size={16}
                    className={`${
                      active ? "text-discord-accent" : "text-discord-text-muted"
                    }`}
                  />
                  <span className="truncate">{ch.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* VOICE CHANNELS */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wide text-discord-text-muted mb-2 px-2">
            Voice Channels
          </h2>
          <div className="flex flex-col gap-[2px]">
            {voiceChannels.map((ch) => {
              const active = pathname.includes(ch.id);
              return (
                <Link
                  key={ch.id}
                  href={`/servers/${serverId}/channels/${ch.id}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[15px] transition-colors
                    ${
                      active
                        ? "bg-discord-hover text-discord-text-primary font-medium"
                        : "text-discord-text-secondary hover:bg-discord-hover hover:text-white"
                    }`}
                >
                  <Volume2
                    size={16}
                    className={`${
                      active ? "text-discord-accent" : "text-discord-text-muted"
                    }`}
                  />
                  <span className="truncate">{ch.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* SERVER FOOTER (Optional placeholder for user/settings) */}
      <div className="border-t border-[var(--border-color)] px-3 py-2 text-[13px] text-discord-text-muted">
        <div className="flex items-center justify-between">
          <span>Connected</span>
          <span className="text-[10px] text-green-500">●</span>
        </div>
      </div>
    </aside>
  );
}
