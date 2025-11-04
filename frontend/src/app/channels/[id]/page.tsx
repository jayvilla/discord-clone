import ChannelClient from "./ChannelClient";

// ⚠️ no "use client" here
export default async function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ unwrap the promise
  return <ChannelClient channelId={id} />;
}
