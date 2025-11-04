import ServerClientPage from "./ServerClient";

export default async function ServerPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServerClientPage serverId={id} />;
}
