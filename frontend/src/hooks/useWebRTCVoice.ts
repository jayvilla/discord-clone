"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Peer {
  id: string;
  username: string;
  stream: MediaStream;
}

const socket: Socket = io(`${process.env.NEXT_PUBLIC_API_URL}/voice`, {
  transports: ["websocket"],
});

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
        socket.emit("webrtc:candidate", {
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
    socket.emit("webrtc:offer", { channelId, offer, to: socketId });
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

        // Optionally emit to server for shared "speaking" UI
        socket.emit("voice:speaking", {
          channelId,
          userId: name,
          isSpeaking: speaking,
        });

        requestAnimationFrame(loop);
      };
      loop();
    } catch (err) {
      console.warn("🎙️ Voice detection error:", err);
    }
  }

  useEffect(() => {
    if (!channelId) return;

    // 🛰️ Join voice namespace + channel
    socket.emit("voice:join", { channelId, userId, username });

    // 🧠 Voice user list updates
    socket.on(
      "voice:users",
      async (payload: { channelId: string; users: any[] }) => {
        if (payload.channelId !== channelId) return;

        console.log("👥 voice:users:", payload.users);
        const others = payload.users.filter((u) => u.socketId !== socket.id);

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

    // Incremental join/leave updates
    socket.on("voice:userJoined", ({ user }) => {
      console.log(`🎤 ${user.username} joined voice`);
    });

    socket.on("voice:userLeft", ({ userId }) => {
      console.log(`🔇 User ${userId} left voice`);
      setPeers((prev) => prev.filter((p) => p.id !== userId));
    });

    // WebRTC signaling
    socket.on("webrtc:offer", async ({ from, offer }) => {
      const pc = await createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc:answer", { to: from, answer });
    });

    socket.on("webrtc:answer", async ({ from, answer }) => {
      const pc = peerConnections.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("webrtc:candidate", ({ from, candidate }) => {
      const pc = peerConnections.current.get(from);
      if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // Optional: handle server-driven speaking events
    socket.on("voice:userSpeaking", ({ userId, isSpeaking }) => {
      setActiveSpeakers((prev) => {
        const has = prev.includes(userId);
        if (isSpeaking && !has) return [...prev, userId];
        if (!isSpeaking && has) return prev.filter((id) => id !== userId);
        return prev;
      });
    });

    return () => {
      socket.emit("voice:leave", { channelId, userId });
      socket.off("voice:users");
      socket.off("voice:userJoined");
      socket.off("voice:userLeft");
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:candidate");
      socket.off("voice:userSpeaking");

      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      analyserRefs.current.clear();
      setPeers([]);
      setActiveSpeakers([]);
    };
  }, [channelId, userId, username]);

  return { localStreamRef, peers, activeSpeakers };
}
