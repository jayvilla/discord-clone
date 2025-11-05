import { ReactNode, use } from "react";
import ServerSidebar from "@/components/ServerSidebar";
import { ServerChannelList } from "@/components/ServerChannelList";
import ServerMembersSidebar from "@/components/ServerMembersSidebar";
import TopBar from "@/components/TopBar"; // ✅ import the TopBar

export default function ServerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: serverId } = use(params);

  return (
    <div className="flex h-screen bg-discord-primary text-discord-text-primary">
      {/* LEFT: Server bubbles */}
      <ServerSidebar />

      {/* MIDDLE: Channels + Chat + Members */}
      <div className="flex flex-1">
        {/* Channel List */}
        <ServerChannelList serverId={serverId} />

        {/* CENTER: Chat column */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* ✅ TopBar goes HERE */}
          <TopBar serverId={serverId} />

          {/* Chat content */}
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>

        {/* RIGHT: Members */}
        <ServerMembersSidebar serverId={serverId} />
      </div>
    </div>
  );
}
