"use client";

import { useEffect, useState } from "react";
import { getServers } from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CreateServerModal from "./CreateServerModal";
import clsx from "clsx";

interface Server {
  id: string;
  name: string;
  iconUrl?: string | null;
}

export default function ServerSidebar() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
      <div className="server-sidebar text-neutral-400 text-xs flex flex-col items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="server-sidebar text-red-400 text-xs text-center px-2">
        {error}
      </div>
    );
  }

  return (
    <>
      <aside
        className={clsx(
          "server-sidebar",
          "h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-800 flex flex-col items-center py-4 space-y-3"
        )}
      >
        {/* Server list */}
        <nav className="flex flex-col items-center gap-3 w-full">
          {servers.map((s) => {
            const isActive = pathname.includes(`/servers/${s.id}`);

            return (
              <Link
                key={s.id}
                href={`/servers/${s.id}`}
                title={s.name}
                className={clsx(
                  "group relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 ease-in-out overflow-hidden",
                  isActive
                    ? "bg-discord-accent text-white shadow-[0_0_8px_rgba(88,101,242,0.6)]"
                    : "bg-neutral-700 hover:bg-discord-accent/80 hover:rounded-2xl"
                )}
              >
                {s.iconUrl ? (
                  <img
                    src={s.iconUrl}
                    alt={s.name}
                    className="w-12 h-12 object-cover rounded-full group-hover:rounded-2xl transition-all"
                  />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                )}

                {/* Active indicator bar */}
                <div
                  className={clsx(
                    "absolute left-0 w-[4px] rounded-r-md bg-white transition-all duration-200",
                    isActive
                      ? "h-8 opacity-100"
                      : "h-2 opacity-0 group-hover:opacity-100"
                  )}
                ></div>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="h-[2px] w-8 bg-neutral-700 rounded-full my-2"></div>

          {/* Create Server */}
          <button
            onClick={() => setShowModal(true)}
            title="Create Server"
            className="w-12 h-12 rounded-full bg-neutral-700 text-2xl text-neutral-300 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:rounded-2xl transition-all duration-200 ease-in-out"
          >
            +
          </button>
        </nav>
      </aside>

      {/* Create Server Modal (kept outside scroll area) */}
      {showModal && (
        <CreateServerModal
          onClose={() => setShowModal(false)}
          onCreated={(newServer) => setServers((prev) => [...prev, newServer])}
        />
      )}
    </>
  );
}
