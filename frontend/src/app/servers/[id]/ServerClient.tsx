"use client";

import { useEffect, useState } from "react";
import { getServerById } from "@/lib/api";
import ServerSidebar from "@/components/ServerSidebar";
import { Volume2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useWebRTCVoice } from "@/hooks/useWebRTCVoice";
import { VoiceUserList } from "@/components/VoiceUserList";
import { ActiveSpeakerPopup } from "@/components/ActiveSpeakerPopup";

export default function ServerClientPage({ serverId }: { serverId: string }) {
  const [server, setServer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(
    null
  );

  const userId = "user_cuid_123"; // TODO: replace with actual auth user later
  const username = "Jeff Villa";

  // ─────────────────────────────────────────────
  // Fetch server data
  // ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await getServerById(serverId);
        setServer(data);
      } catch (err) {
        console.error("Failed to load server:", err);
        setError("Failed to load server");
      } finally {
        setLoading(false);
      }
    })();
  }, [serverId]);

  // ─────────────────────────────────────────────
  // Voice: WebRTC + Audio presence
  // ─────────────────────────────────────────────
  const { localStreamRef, peers, activeSpeakers } = useWebRTCVoice(
    activeChannel || "",
    userId,
    username
  );

  // Join or leave a voice channel
  function handleToggleVoice(channelId: string, name: string) {
    if (activeChannel === channelId) {
      console.log(`🔇 Leaving voice channel: ${name}`);
      try {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch (e) {
        console.warn("Error stopping stream:", e);
      }
      setActiveChannel(null);
      setActiveChannelName(null);
    } else {
      console.log(`🎤 Joining voice channel: ${name}`);
      setActiveChannel(channelId);
      setActiveChannelName(name);
    }
  }

  // ─────────────────────────────────────────────
  // Render states
  // ─────────────────────────────────────────────
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

  const textChannels = server.channels.filter((c: any) => c.type === "TEXT");
  const voiceChannels = server.channels.filter((c: any) => c.type === "VOICE");

  // ─────────────────────────────────────────────
  // UI Layout
  // ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white">
      <div className="flex flex-1">
        {/* Sidebar */}
        <ServerSidebar />

        {/* Main content */}
        <div className="flex-1 flex flex-col bg-neutral-900">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
            <h1 className="text-xl font-bold">{server.name}</h1>
          </div>

          {/* Channel lists */}
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Text Channels */}
            <div>
              <h2 className="text-xs uppercase font-semibold text-neutral-500 mb-2">
                📄 Text Channels
              </h2>
              {textChannels.map((ch: any) => (
                <Link
                  key={ch.id}
                  href={`/channels/${ch.id}`}
                  className="block text-neutral-300 hover:text-white hover:bg-neutral-800 px-3 py-2 rounded-md transition"
                >
                  # {ch.name}
                </Link>
              ))}
            </div>

            {/* Voice Channels */}
            <div>
              <h2 className="text-xs uppercase font-semibold text-neutral-500 mb-2">
                🔊 Voice Channels
              </h2>
              {voiceChannels.map((ch: any) => {
                const isActive = activeChannel === ch.id;
                return (
                  <div
                    key={ch.id}
                    className={`flex justify-between items-center p-2 rounded-md transition ${
                      isActive
                        ? "bg-indigo-700"
                        : "bg-neutral-800/40 hover:bg-neutral-800"
                    }`}
                  >
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
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────── */}
      {/* Bottom Voice Bar */}
      {/* ───────────────────────────────────────────── */}
      {activeChannel && (
        <>
          <ActiveSpeakerPopup activeSpeakers={activeSpeakers} />
          <div className="h-44 bg-neutral-800 border-t border-neutral-700 flex flex-col px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Volume2 className="text-indigo-400" />
                <div>
                  <div className="text-sm font-semibold">
                    {activeChannelName}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {peers.length > 0
                      ? `${peers.length + 1} connected`
                      : "Only you here"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
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

            <VoiceUserList
              localStream={localStreamRef.current}
              peers={peers}
              username={username}
              activeSpeakers={activeSpeakers}
            />
          </div>
        </>
      )}
    </div>
  );
}
