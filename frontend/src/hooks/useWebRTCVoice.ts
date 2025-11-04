"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");

interface Peer {
  id: string;
  stream: MediaStream;
}

export function useWebRTCVoice(
  channelId: string,
  userId: string,
  username: string
) {
  const [peers, setPeers] = useState<Peer[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});

  /** Create peer connection and set remote audio handling */
  const createPeerConnection = (remoteId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { to: remoteId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setPeers((prev) => {
        if (!prev.find((p) => p.id === remoteId)) {
          return [...prev, { id: remoteId, stream }];
        }
        return prev;
      });
    };

    return pc;
  };

  useEffect(() => {
    if (!channelId) return;

    // 1️⃣ Setup local audio
    const startLocalAudio = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // Add local stream to peers when connected
      socket.emit("joinVoice", { channelId, userId, username });
    };
    startLocalAudio();

    // 2️⃣ When someone joins, create a peer connection
    socket.on("userJoined", async ({ id: remoteId }) => {
      if (remoteId === socket.id) return;
      const pc = createPeerConnection(remoteId);
      peerConnections.current[remoteId] = pc;

      // Add local tracks
      localStreamRef.current
        ?.getTracks()
        .forEach((track) => pc.addTrack(track, localStreamRef.current!));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { channelId, to: remoteId, offer });
    });

    // 3️⃣ When offer received
    socket.on("offer", async ({ from, offer }) => {
      const pc = createPeerConnection(from);
      peerConnections.current[from] = pc;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      localStreamRef.current
        ?.getTracks()
        .forEach((track) => pc.addTrack(track, localStreamRef.current!));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    });

    // 4️⃣ When answer received
    socket.on("answer", async ({ from, answer }) => {
      const pc = peerConnections.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // 5️⃣ Handle ICE candidates
    socket.on("ice-candidate", async ({ from, candidate }) => {
      const pc = peerConnections.current[from];
      if (pc && candidate)
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // 6️⃣ When user leaves
    socket.on("userLeft", ({ id }) => {
      if (peerConnections.current[id]) {
        peerConnections.current[id].close();
        delete peerConnections.current[id];
        setPeers((prev) => prev.filter((p) => p.id !== id));
      }
    });

    // 7️⃣ Cleanup
    return () => {
      socket.emit("leaveVoice", { channelId, userId });
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      setPeers([]);
    };
  }, [channelId, userId, username]);

  return { localStreamRef, peers };
}
