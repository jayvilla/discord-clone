// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
});

// ============= 🏠 SERVERS ==================
export async function createServer(data: {
  name: string;
  ownerId: string;
  iconUrl?: string;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create server");
  return res.json();
}

export const getServers = async () => {
  const res = await api.get("/servers");
  return res.data;
};

export const getServerById = async (serverId: string) => {
  if (!serverId) {
    console.error("⚠️ getServerById called without serverId");
    throw new Error("Missing serverId in getServerById");
  }

  console.log("🔍 Fetching server:", serverId); // add this
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}`
  );

  if (!res.ok) {
    console.error("❌ Error fetching server:", await res.text());
    throw new Error(`Failed to fetch server: ${res.status}`);
  }

  return res.json();
};

// ============= 💬 CHANNELS ==================
export const getChannels = async (serverId: string) => {
  const res = await api.get(`/servers/${serverId}`);
  return res.data.channels;
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

export const getMessagesByChannel = async (channelId: string) => {
  if (!channelId) throw new Error("Missing channelId in getMessagesByChannel");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/channels/${channelId}/messages`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch messages for channel ${channelId}`);
  }

  return res.json();
};

export const postMessage = async (
  channelId: string,
  data: { authorId: string; content: string }
) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) throw new Error("Failed to post message");
  return res.json();
};

// ============= 👥 USERS ==================
/**
 * Returns all members in a given server.
 * Your backend should expose: GET /servers/:id/users
 */
export const getServerUsers = async (serverId: string) => {
  const res = await api.get(`/servers/${serverId}/users`);
  return res.data;
};
