// app/servers/[id]/layout.tsx
import { ReactNode, use } from "react";
import ServerSidebar from "@/components/ServerSidebar";
import { ServerChannelList } from "@/components/ServerChannelList";
import ServerMembersSidebar from "@/components/ServerMembersSidebar";

export default function ServerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>; // Next 15: params is a Promise
}) {
  const { id: serverId } = use(params);

  return (
    <div className="flex h-screen bg-neutral-900 text-white">
      {/* Left-most server bubbles */}
      <ServerSidebar />

      {/* Middle: server’s channels + main */}
      <div className="flex-1 flex">
        <ServerChannelList serverId={serverId} />
        <div className="flex-1 overflow-hidden">{children}</div>

        {/* Right: members */}
        <ServerMembersSidebar serverId={serverId} />
      </div>
    </div>
  );
}
