"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function DeleteButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function handleDelete() {
    if (!confirm("Delete this proposal?")) return;
    setLoading(true);
    await fetch("/api/proposals", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: proposalId }) });
    router.refresh();
  }
  return (
    <button onClick={handleDelete} disabled={loading} className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
      {loading ? "..." : "Delete"}
    </button>
  );
}
