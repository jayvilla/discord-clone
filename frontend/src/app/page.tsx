"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getServers } from "@/lib/api";
import { getChannels } from "@/lib/api";

interface Server {
  id: string;
  name: string;
  iconUrl?: string | null;
}

interface Channel {
  id: string;
  name: string;
}

export default function HomePage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [channelsByServer, setChannelsByServer] = useState<
    Record<string, Channel[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const serversData = await getServers();
        console.log("serversData", serversData);
        setServers(serversData);

        // Fetch channels for each server
        const channelsMap: Record<string, Channel[]> = {};
        for (const server of serversData) {
          try {
            const channels = await getChannels(server.id);
            channelsMap[server.id] = channels;
          } catch (err) {
            console.warn(`Failed to load channels for ${server.name}`);
          }
        }

        setChannelsByServer(channelsMap);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900 text-gray-300">
        Loading servers...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to Discord Clone</h1>
      <p className="text-neutral-400 mb-10">
        Select a server and channel to start chatting.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => (
          <div
            key={server.id}
            className="bg-neutral-800 rounded-xl shadow-md p-5 border border-neutral-700"
          >
            <div className="flex items-center space-x-3 mb-3">
              {server.iconUrl ? (
                <img
                  src={server.iconUrl}
                  alt={server.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-full font-bold">
                  {server.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="text-lg font-semibold">{server.name}</h2>
            </div>

            <div className="space-y-2">
              {channelsByServer[server.id]?.length ? (
                channelsByServer[server.id].map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/channels/${ch.id}`}
                    className="block text-neutral-300 hover:text-white hover:bg-neutral-700 px-3 py-2 rounded transition"
                  >
                    # {ch.name}
                  </Link>
                ))
              ) : (
                <p className="text-neutral-500 text-sm italic">
                  No channels available
                </p>
              )}
            </div>

            <div className="mt-4">
              <Link
                href={`/servers/${server.id}`}
                className="inline-block mt-2 text-indigo-400 hover:text-indigo-300 text-sm"
              >
                View all channels →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
