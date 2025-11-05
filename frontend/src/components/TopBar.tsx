"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getServerById, getChannelById } from "@/lib/api";
import { Search, Settings } from "lucide-react";

export default function TopBar({ serverId }: { serverId?: string }) {
  const pathname = usePathname();
  const [title, setTitle] = useState("Raidium Chat");
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    async function fetchTitle() {
      try {
        if (pathname.includes("/channels/")) {
          const channelId = pathname.split("/").pop();
          if (!channelId) return;
          const ch = await getChannelById(channelId);
          console.log("ch", ch);
          setTitle(`#${ch.name}`);
          setSubtitle("Text Channel");
        } else if (serverId) {
          const srv = await getServerById(serverId);
          setTitle(srv.name);
          setSubtitle("Server Overview");
        } else {
          setTitle("Raidium Chat");
          setSubtitle("");
        }
      } catch (err) {
        console.error("Failed to load title:", err);
      }
    }
    fetchTitle();
  }, [pathname, serverId]);

  return (
    <header className="chat-header">
      <div className="flex items-center gap-2 truncate">
        <span className="text-[16px] font-semibold text-white leading-none">
          {title}
        </span>
        {subtitle && (
          <span className="text-[12px] text-discord-text-muted leading-none">
            {subtitle}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-discord-text-muted">
        <button title="Search" className="hover:text-white transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button title="Settings" className="hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
