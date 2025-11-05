// app/servers/[id]/page.tsx
import { redirect } from "next/navigation";
import { getServerById } from "@/lib/api";

export default async function ServerHome({
  params,
}: {
  params: Promise<{ id: string }>; // ✅ make this a Promise
}) {
  const { id } = await params; // ✅ unwrap the async params
  if (!id) {
    console.error("⚠️ Missing server ID in /servers/[id]/page.tsx");
    return <div className="text-white p-6">Invalid server ID</div>;
  }

  const server = await getServerById(id).catch((err) => {
    console.error("❌ Failed to load server:", err);
    return null;
  });

  if (!server) {
    return <div className="text-white p-6">Server not found</div>;
  }

  const firstText = server.channels?.find((c: any) => c.type === "TEXT");

  if (firstText) {
    redirect(`/servers/${id}/channels/${firstText.id}`);
  }

  return <div className="text-white p-6">No channels found</div>;
}
