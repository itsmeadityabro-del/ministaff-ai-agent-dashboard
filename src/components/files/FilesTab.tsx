"use client";

import { FilesView } from "./FilesView";

// Members can browse and preview files, while server-side routes enforce admin on every mutation.
export function FilesTab({ agentId, canWrite }: { agentId: string; canWrite: boolean }) {
  return <FilesView agentId={agentId} canWrite={canWrite} />;
}
