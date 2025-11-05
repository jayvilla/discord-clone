import { ServerChannelList } from "@/components/ServerChannelList";
import ServerSidebar from "@/components/ServerSidebar";
import ServerUserSidebar from "@/components/ServerUserSidebar";

export default async function ServerLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;

  return (
    <div className="flex h-screen">
      <ServerSidebar />
      <ServerChannelList serverId={id} />
      <div className="flex-1 overflow-hidden">{children}</div>
      <ServerUserSidebar serverId={id} />
    </div>
  );
}
