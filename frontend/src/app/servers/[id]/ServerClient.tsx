"use client";

import { useEffect, useState } from "react";
import { getServerById } from "@/lib/api";
import ServerSidebar from "@/components/ServerSidebar";
import { Volume2, Loader2, Users, XCircle } from "lucide-react";
import Link from "next/link";
import { useWebRTCVoice } from "@/hooks/useWebRTCVoice"; // ✅ new hook

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

  const userId = "user_cuid_123"; // TODO: integrate auth
  const username = "Jeff Villa";

  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(
    null
  );

  // Fetch server data
  useEffect(() => {
    async function fetchServer() {
      try {
        const data = await getServerById(serverId);
        setServer(data);
      } catch (e) {
        console.error("Failed to load server", e);
        setError("Failed to load server");
      } finally {
        setLoading(false);
      }
    }
    fetchServer();
  }, [serverId]);

  // 🎤 WebRTC Voice Hook (only active when in voice channel)
  const { localStreamRef, peers } = useWebRTCVoice(
    activeChannel || "",
    userId,
    username
  );

  /** ✅ Join or leave a voice channel */
  function handleToggleVoice(channelId: string, name: string) {
    if (activeChannel === channelId) {
      console.log(`🔇 Leaving voice channel: ${name}`);
      // Stop all local tracks
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      setActiveChannel(null);
      setActiveChannelName(null);
    } else {
      console.log(`🎤 Joining voice channel: ${name}`);
      setActiveChannel(channelId);
      setActiveChannelName(name);
    }
  }

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
    <div className="flex flex-col h-screen bg-neutral-900 text-white">
      {/* --- Top Section (Main Content) --- */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <ServerSidebar />

        {/* Main area */}
        <div className="flex-1 flex flex-col bg-neutral-900">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
            <h1 className="text-xl font-bold">{server.name}</h1>
          </div>

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
                    const isActive = activeChannel === ch.id;

                    return (
                      <div
                        key={ch.id}
                        className={`flex flex-col gap-1 rounded-md transition p-2 ${
                          isActive
                            ? "bg-indigo-700"
                            : "bg-neutral-800/40 hover:bg-neutral-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-neutral-300">
                            <Volume2 size={16} className="opacity-70" />
                            {ch.name}
                          </div>
                          <button
                            onClick={() => handleToggleVoice(ch.id, ch.name)}
                            className={`text-xs ${
                              isActive
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-indigo-600 hover:bg-indigo-700"
                            } px-2 py-1 rounded transition`}
                          >
                            {isActive ? "Leave" : "Join"}
                          </button>
                        </div>
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

      {/* --- Voice Status Bar (Bottom) --- */}
      {activeChannel && (
        <div className="h-16 bg-neutral-800 border-t border-neutral-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Volume2 className="text-indigo-400" />
            <div>
              <div className="text-sm font-semibold">{activeChannelName}</div>
              <div className="text-xs text-neutral-400">
                {peers.length > 0
                  ? `${peers.length} connected`
                  : "Only you here"}
              </div>
            </div>
          </div>

          {/* 🎤 Local + Remote audio players */}
          <div className="flex gap-2">
            {/* Local audio (muted) */}
            <audio
              ref={(el) => {
                if (el && localStreamRef.current)
                  el.srcObject = localStreamRef.current;
              }}
              autoPlay
              muted
            />
            {/* Remote peers */}
            {peers.map((peer) => (
              <audio
                key={peer.id}
                autoPlay
                ref={(el) => el && (el.srcObject = peer.stream)}
              />
            ))}
          </div>

          <button
            onClick={() => {
              console.log("🔇 Leaving via footer");
              localStreamRef.current?.getTracks().forEach((t) => t.stop());
              setActiveChannel(null);
              setActiveChannelName(null);
            }}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded-md transition"
          >
            <XCircle size={14} />
            Leave
          </button>
        </div>
      )}
    </div>
  );
}
