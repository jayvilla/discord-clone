"use client";

import { use } from "react"; // ✅ new React 19 hook
import { useEffect, useState } from "react";
import { getServerById } from "@/lib/api";
import Link from "next/link";
import ServerSidebar from "@/components/ServerSidebar";

interface Channel {
  id: string;
  name: string;
}

interface Server {
  id: string;
  name: string;
  channels: Channel[];
}

export default function ServerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ unwrap the params Promise using the new React.use() hook
  const { id: serverId } = use(params);

  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serverId) {
      setError("Missing server ID");
      setLoading(false);
      return;
    }

    async function fetchServer() {
      try {
        const data = await getServerById(serverId);
        setServer(data);
      } catch (err) {
        console.error("Error loading server:", err);
        setError("Failed to load server");
      } finally {
        setLoading(false);
      }
    }

    fetchServer();
  }, [serverId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900 text-white">
        Loading server...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900 text-red-500">
        {error}
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900 text-white">
        Server not found.
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col bg-neutral-900">
        <div className="p-4 border-b border-neutral-800">
          <h1 className="text-xl font-bold">{server.name}</h1>
        </div>
        <div className="p-4 space-y-2">
          {server.channels?.length ? (
            server.channels.map((ch) => (
              <Link
                key={ch.id}
                href={`/channels/${ch.id}`}
                className="block text-neutral-300 hover:text-white hover:bg-neutral-800 px-3 py-2 rounded-md transition"
              >
                # {ch.name}
              </Link>
            ))
          ) : (
            <p className="text-neutral-500 italic">No channels yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
