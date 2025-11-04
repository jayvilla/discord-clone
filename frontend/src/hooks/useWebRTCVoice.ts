"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Peer {
  id: string;
  username: string;
  stream: MediaStream;
}

const socket: Socket = io(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  {
    transports: ["websocket"],
  }
);

export function useWebRTCVoice(
  channelId: string,
  userId: string,
  username: string
) {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const analyserRefs = useRef<Map<string, AnalyserNode>>(new Map());

  useEffect(() => {
    if (!channelId) return;

    socket.emit("joinVoice", { channelId, userId, username });

    // 🧠 Real-time presence updates
    socket.on(
      "voiceUsers",
      async (payload: { channelId: string; users: any[] }) => {
        if (payload.channelId !== channelId) return;

        console.log("👥 voiceUsers:", payload.users);

        const others = payload.users.filter((u) => u.socketId !== socket.id);

        // Update UI list
        setPeers((prev) => {
          const merged = payload.users.map((u) => ({
            id: u.socketId,
            username: u.username,
            stream:
              prev.find((p) => p.id === u.socketId)?.stream ||
              new MediaStream(),
          }));
          return merged;
        });

        // Initiate WebRTC offers to new users
        for (const u of others) {
          if (!peerConnections.current.has(u.socketId)) {
            await createOffer(u.socketId);
          }
        }
      }
    );

    // WebRTC signaling
    socket.on("offer", async ({ from, offer }) => {
      const pc = await createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    });

    socket.on("answer", async ({ from, answer }) => {
      const pc = peerConnections.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", ({ from, candidate }) => {
      const pc = peerConnections.current.get(from);
      if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socket.emit("leaveVoice", { channelId, userId });
      socket.off("voiceUsers");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");

      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      analyserRefs.current.clear();
      setPeers([]);
      setActiveSpeakers([]);
    };
  }, [channelId, userId, username]);

  // ─────────────────────────────
  // WebRTC helpers
  // ─────────────────────────────

  async function getLocalStream() {
    if (!localStreamRef.current) {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      startVoiceDetection(username, localStreamRef.current);
    }
    return localStreamRef.current;
  }

  async function createPeerConnection(socketId: string) {
    const pc = new RTCPeerConnection();
    peerConnections.current.set(socketId, pc);

    const localStream = await getLocalStream();
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      const existing = peers.find((p) => p.id === socketId);
      if (!existing) {
        setPeers((prev) => [
          ...prev,
          {
            id: socketId,
            username: socketId.slice(0, 5),
            stream: remoteStream,
          },
        ]);
      }
      startVoiceDetection(socketId.slice(0, 5), remoteStream);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: socketId,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  }

  async function createOffer(socketId: string) {
    const pc = await createPeerConnection(socketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", { channelId, offer, to: socketId });
  }

  // ─────────────────────────────
  // 🔊 Voice Activity Detection
  // ─────────────────────────────
  function startVoiceDetection(name: string, stream: MediaStream) {
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyserRefs.current.set(name, analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const speaking = avg > 25;
        setActiveSpeakers((prev) => {
          const has = prev.includes(name);
          if (speaking && !has) return [...prev, name];
          if (!speaking && has) return prev.filter((n) => n !== name);
          return prev;
        });
        requestAnimationFrame(loop);
      };
      loop();
    } catch (err) {
      console.warn("🎙️ Voice detection error:", err);
    }
  }

  return { localStreamRef, peers, activeSpeakers };
}
