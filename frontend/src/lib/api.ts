// /frontend/src/lib/api.ts
import axios from "axios";

/* ========================================================================
   📦 API CONFIG
   ======================================================================== */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  withCredentials: true,
});

/* ========================================================================
   🏠 SERVERS
   ======================================================================== */

// ✅ Create a new server
export const createServer = async (data: {
  name: string;
  ownerId: string;
  iconUrl?: string;
}) => {
  const res = await api.post("/servers", data);
  return res.data;
};

// ✅ Get all servers
export const getServers = async () => {
  const res = await api.get("/servers");
  return res.data;
};

// ✅ Get a single server
export const getServerById = async (serverId: string) => {
  if (!serverId) throw new Error("Missing serverId in getServerById");

  console.log("🔍 Fetching server:", serverId);
  const res = await api.get(`/servers/${serverId}`);
  return res.data;
};

/* ========================================================================
   💬 CHANNELS
   ======================================================================== */

// ✅ Get all channels for a server
export const getChannels = async (serverId: string) => {
  if (!serverId) throw new Error("Missing serverId in getServerChannels");

  const res = await api.get(`/servers/${serverId}/channels`);
  return res.data;
};

// ✅ Get a single channel by ID
export const getChannelById = async (channelId: string) => {
  if (!channelId) throw new Error("Missing channelId in getChannelById");

  console.log("📡 Fetching channel:", channelId);
  const res = await api.get(`/channels/${channelId}`);
  return res.data;
};

// ✅ Create a new channel
export const createChannel = async (data: {
  name: string;
  serverId: string;
  type?: "TEXT" | "VOICE" | "ANNOUNCEMENT";
}) => {
  const res = await api.post("/channels", data);
  return res.data;
};

/* ========================================================================
   ✉️ MESSAGES
   ======================================================================== */

// ✅ Get paginated messages for a channel
export const getMessages = async (channelId: string, cursor?: string) => {
  if (!channelId) throw new Error("Missing channelId in getMessages");

  const url = cursor
    ? `/channels/${channelId}/messages?cursor=${cursor}`
    : `/channels/${channelId}/messages`;

  const res = await api.get(url);
  return res.data.items || res.data; // supports both array or { items }
};

// ✅ Get all messages for a channel (no pagination)
export const getMessagesByChannel = async (channelId: string) => {
  if (!channelId) throw new Error("Missing channelId in getMessagesByChannel");

  const res = await api.get(`/channels/${channelId}/messages`);
  return res.data;
};

// ✅ Post a new message
export const postMessage = async (
  channelId: string,
  data: { userId: string; content: string; socketId?: string }
) => {
  if (!channelId) throw new Error("Missing channelId in postMessage");

  const res = await api.post(`/channels/${channelId}/messages`, data);
  return res.data;
};

/* ========================================================================
   👥 USERS
   ======================================================================== */

// ✅ Get all users (members) of a server
export const getServerUsers = async (serverId: string) => {
  if (!serverId) throw new Error("Missing serverId in getServerUsers");

  const res = await api.get(`/servers/${serverId}`);
  const server = res.data;

  // server.members[].user = { id, username, ... }
  return (server.members || []).map((m: any) => m.user);
};
