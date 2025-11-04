import { io, Socket } from "socket.io-client";

// Connect to your NestJS backend
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socket;
};
