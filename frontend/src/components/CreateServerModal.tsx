"use client";

import { useState } from "react";
import { createServer } from "@/lib/api";

export default function CreateServerModal({ onClose, onCreated }: any) {
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const ownerId = "user_cuid_123"; // TODO: replace with logged-in user later

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const newServer = await createServer({ name, ownerId, iconUrl });
      onCreated(newServer);
      onClose();
    } catch (err) {
      console.error("Failed to create server:", err);
      alert("Error creating server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-800 p-6 rounded-lg w-80 space-y-4">
        <h2 className="text-lg font-bold text-white">Create a Server</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Server name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded bg-neutral-700 text-white outline-none"
          />
          <input
            type="text"
            placeholder="Icon URL (optional)"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            className="w-full p-2 rounded bg-neutral-700 text-white outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
        <button
          onClick={onClose}
          className="w-full text-sm text-neutral-400 hover:text-white mt-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
