"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getServerById, getChannelById } from "@/lib/api";
import { Search, Settings } from "lucide-react";

export default function TopBar({ serverId }: { serverId?: string }) {
  const pathname = usePathname();
  const [title, setTitle] = useState("Raidium Chat");

  useEffect(() => {
    async function fetchTitle() {
      if (pathname.startsWith("/channels/")) {
        const channelId = pathname.split("/").pop();
        const ch = await getChannelById(channelId!);
        setTitle(`#${ch.name}`);
      } else if (serverId) {
        const srv = await getServerById(serverId);
        setTitle(srv.name);
      } else {
        setTitle("Raidium Chat");
      }
    }
    fetchTitle();
  }, [pathname, serverId]);

  return (
    <div className="flex items-center justify-between bg-neutral-800 border-b border-neutral-700 px-4 py-2">
      <h2 className="text-lg font-bold truncate">{title}</h2>
      <div className="flex gap-4 text-neutral-400">
        <Search className="w-5 h-5 cursor-pointer hover:text-white" />
        <Settings className="w-5 h-5 cursor-pointer hover:text-white" />
      </div>
    </div>
  );
}
