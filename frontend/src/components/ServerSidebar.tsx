"use client";

import { useEffect, useState } from "react";
import { getServers } from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Server {
  id: string;
  name: string;
  iconUrl?: string | null;
}

export default function ServerSidebar() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchServers() {
      try {
        setLoading(true);
        const data = await getServers();
        setServers(data);
      } catch (err) {
        console.error("Failed to fetch servers:", err);
        setError("Unable to load servers.");
      } finally {
        setLoading(false);
      }
    }
    fetchServers();
  }, []);

  if (loading) {
    return (
      <div className="w-20 bg-neutral-800 flex flex-col items-center py-4 space-y-3 text-neutral-400 text-sm">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-20 bg-neutral-800 flex flex-col items-center py-4 space-y-3 text-red-500 text-xs text-center px-1">
        {error}
      </div>
    );
  }

  return (
    <div className="w-20 bg-neutral-800 flex flex-col items-center py-4 space-y-3">
      {servers.map((s) => {
        const isActive = pathname.includes(`/servers/${s.id}`);
        return (
          <Link
            key={s.id}
            href={`/servers/${s.id}`}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${
                isActive
                  ? "bg-indigo-600"
                  : "bg-neutral-700 hover:bg-indigo-500"
              }
            `}
            title={s.name}
          >
            {s.iconUrl ? (
              <img
                src={s.iconUrl}
                alt={s.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              s.name.charAt(0).toUpperCase()
            )}
          </Link>
        );
      })}
    </div>
  );
}
