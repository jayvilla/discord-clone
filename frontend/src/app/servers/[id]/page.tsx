"use client";

import { useEffect, useState } from "react";
import { getChannels, getServerById } from "@/lib/api";
import Link from "next/link";
import ServerSidebar from "@/components/ServerSidebar";

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface Server {
  id: string;
  name: string;
  iconUrl?: string;
}

export default function ServerPage({ params }: { params: { id: string } }) {
  const { id: serverId } = params;
  const [server, setServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServerData() {
      try {
        setLoading(true);
        const serverData = await getServerById(serverId);
        setServer(serverData);
        setChannels(serverData.channels || []);
      } catch (err) {
        console.error("Failed to load server data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchServerData();
  }, [serverId]);

  if (loading) {
    return (
      <div className="flex h-screen bg-neutral-900 text-white items-center justify-center">
        <p>Loading server...</p>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex h-screen bg-neutral-900 text-white items-center justify-center">
        <p>Server not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Left column: all servers */}
      <ServerSidebar />

      {/* Middle column: channel list */}
      <div className="w-60 bg-neutral-850 p-4 border-r border-neutral-700 flex flex-col">
        <h2 className="font-bold mb-3 text-lg text-white truncate">
          {server.name}
        </h2>
        <div className="flex flex-col space-y-1 overflow-y-auto">
          {channels.map((c) => (
            <Link
              key={c.id}
              href={`/channels/${c.id}`}
              className="block px-2 py-1 rounded hover:bg-neutral-700 transition"
            >
              # {c.name}
            </Link>
          ))}

          {channels.length === 0 && (
            <p className="text-neutral-500 italic">No channels yet</p>
          )}
        </div>
      </div>

      {/* Right column: placeholder area */}
      <div className="flex-1 flex items-center justify-center bg-neutral-900 text-neutral-400">
        <p>Select a channel →</p>
      </div>
    </div>
  );
}
