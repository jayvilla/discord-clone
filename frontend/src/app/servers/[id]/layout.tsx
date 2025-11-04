"use client";

import { ReactNode, use } from "react";
import ServerSidebar from "@/components/ServerSidebar";
import TopBar from "@/components/TopBar";

export default function ServerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  // ✅ Unwrap the async params using React.use()
  const { id } = use(params);

  return (
    <div className="flex h-screen">
      <div className="flex flex-col flex-1">
        <TopBar serverId={id} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
