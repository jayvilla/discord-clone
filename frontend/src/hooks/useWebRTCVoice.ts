"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Peer {
  id: string;
  stream: MediaStream;
  username: string;
}

const socket: Socket = io(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  { transports: ["websocket"] }
);

export function useWebRTCVoice(
  channelId: string,
  userId: string,
  username: string
) {
  const [peers, setPeers] = useState<Peer[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  useEffect(() => {
    if (!channelId) return;

    socket.emit("joinVoice", { channelId, userId, username });

    // Handle peers list updates
    socket.on("voicePeers", async (users: any[]) => {
      const others = users.filter((u) => u.socketId !== socket.id);
      for (const user of others) {
        if (!peerConnections.current.has(user.socketId)) {
          await createOffer(user.socketId);
        }
      }
    });

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
      socket.off("voicePeers");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      setPeers([]);
    };
  }, [channelId, userId, username]);

  async function getLocalStream() {
    if (!localStreamRef.current) {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    }
    return localStreamRef.current;
  }

  async function createPeerConnection(socketId: string) {
    const pc = new RTCPeerConnection();
    peerConnections.current.set(socketId, pc);

    const localStream = await getLocalStream();
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setPeers((prev) => {
        if (prev.some((p) => p.id === socketId)) return prev;
        const name =
          (event as any).username ||
          socketId.slice(0, 5); /* fallback if no username yet */
        return [
          ...prev,
          { id: socketId, stream: remoteStream, username: name },
        ];
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate)
        socket.emit("ice-candidate", {
          to: socketId,
          candidate: event.candidate,
        });
    };

    return pc;
  }

  async function createOffer(socketId: string) {
    const pc = await createPeerConnection(socketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", { channelId, offer, to: socketId });
  }

  return { localStreamRef, peers };
}
