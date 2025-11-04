"use client";

import { useEffect, useState } from "react";
import { getServerById } from "@/lib/api";
import ServerSidebar from "@/components/ServerSidebar";
import { Volume2, Loader2, Users } from "lucide-react";
import { io } from "socket.io-client";
import { useVoiceChannel } from "@/hooks/useVoiceChannel";
import Link from "next/link";

// Reuse a single socket across the app
const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");

interface Channel {
  id: string;
  name: string;
  type: "TEXT" | "VOICE";
}

interface Server {
  id: string;
  name: string;
  channels: Channel[];
}

export default function ServerClientPage({ serverId }: { serverId: string }) {
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = "user_cuid_123"; // TODO: integrate auth later
  const username = "Jeff Villa";

  // Load server details
  useEffect(() => {
    async function fetchServer() {
      try {
        const data = await getServerById(serverId);
        setServer(data);
      } catch (e) {
        setError("Failed to load server");
      } finally {
        setLoading(false);
      }
    }
    fetchServer();
  }, [serverId]);

  // Track active voice channel users
  const [activeVoice, setActiveVoice] = useState<{
    [channelId: string]: string[];
  }>({});

  useEffect(() => {
    socket.on("voiceUsers", (payload: any) => {
      if (payload?.channelId && Array.isArray(payload.users)) {
        setActiveVoice((prev) => ({
          ...prev,
          [payload.channelId]: payload.users.map((u: any) => u.username),
        }));
      }
    });

    return () => {
      socket.off("voiceUsers");
    };
  }, []);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900 text-white">
        <Loader2 className="animate-spin mr-2" /> Loading server...
      </div>
    );

  if (error)
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900 text-red-500">
        {error}
      </div>
    );

  if (!server)
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900 text-white">
        Server not found.
      </div>
    );

  const textChannels = server.channels.filter((c) => c.type === "TEXT");
  const voiceChannels = server.channels.filter((c) => c.type === "VOICE");

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <ServerSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-neutral-900 text-white">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <h1 className="text-xl font-bold">{server.name}</h1>
        </div>

        {/* Channel lists */}
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* --- TEXT CHANNELS --- */}
          <div>
            <h2 className="text-xs uppercase font-semibold text-neutral-500 tracking-wide mb-2">
              📄 Text Channels
            </h2>
            {textChannels.length ? (
              <div className="space-y-1">
                {textChannels.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/channels/${ch.id}`}
                    className="block text-neutral-300 hover:text-white hover:bg-neutral-800 px-3 py-2 rounded-md transition"
                  >
                    # {ch.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-neutral-600 italic text-sm">
                No text channels yet.
              </p>
            )}
          </div>

          {/* --- VOICE CHANNELS --- */}
          <div>
            <h2 className="text-xs uppercase font-semibold text-neutral-500 tracking-wide mb-2">
              🔊 Voice Channels
            </h2>
            {voiceChannels.length ? (
              <div className="space-y-2">
                {voiceChannels.map((ch) => {
                  const members = activeVoice[ch.id] || [];
                  const isConnected = members.includes(username);
                  return (
                    <div
                      key={ch.id}
                      className="flex flex-col gap-1 bg-neutral-800/40 rounded-md hover:bg-neutral-800 transition p-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-neutral-300">
                          <Volume2 size={16} className="opacity-70" />
                          {ch.name}
                        </div>
                        <button
                          onClick={() =>
                            handleJoinVoice(ch.id, ch.name, isConnected)
                          }
                          className={`text-xs ${
                            isConnected
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-indigo-600 hover:bg-indigo-700"
                          } px-2 py-1 rounded transition`}
                        >
                          {isConnected ? "Leave" : "Join"}
                        </button>
                      </div>

                      {members.length > 0 && (
                        <div className="pl-6 flex items-center gap-1 text-xs text-neutral-400">
                          <Users size={12} />
                          {members.join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-neutral-600 italic text-sm">
                No voice channels yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /** ✅ Join or leave a voice channel */
  function handleJoinVoice(
    channelId: string,
    name: string,
    isConnected: boolean
  ) {
    if (isConnected) {
      console.log(`🔇 Leaving voice channel: ${name}`);
      socket.emit("leaveVoice", { channelId, userId });
    } else {
      console.log(`🎤 Joining voice channel: ${name}`);
      socket.emit("joinVoice", { channelId, userId, username });
    }
  }
}
