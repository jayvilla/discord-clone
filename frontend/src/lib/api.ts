import axios from "axios";

// Automatically use your environment variable
// Define this in your `.env.local`: NEXT_PUBLIC_API_URL=http://localhost:4000
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
});

// ============= 🏠 SERVERS ==================
export const getServers = async () => {
  const res = await api.get("/servers");
  return res.data;
};

export const getServerById = async (serverId: string) => {
  if (!serverId) throw new Error("Missing serverId in getServerById");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch server: ${res.status}`);
  }

  return res.json();
};

// ============= 💬 CHANNELS ==================
export const getChannels = async (serverId: string) => {
  const res = await api.get(`/servers/${serverId}`);
  return res.data.channels; // the backend returns channels inside the server
};

export const getChannelById = async (channelId: string) => {
  const res = await api.get(`/channels/${channelId}`);
  return res.data;
};

// ============= ✉️ MESSAGES ==================
export const getMessages = async (channelId: string) => {
  const res = await api.get(`/channels/${channelId}/messages`);
  return res.data;
};

export const postMessage = async (channelId: string, data: any) => {
  const res = await api.post(`/channels/${channelId}/messages`, data);
  return res.data;
};
