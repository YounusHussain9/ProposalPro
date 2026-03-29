"use client";
import { useState } from "react";

const STATUS_OPTIONS = ["draft", "sent", "accepted", "declined"] as const;
type Status = typeof STATUS_OPTIONS[number];

const STATUS_STYLES: Record<Status, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

export default function StatusDropdown({ proposalId, initialStatus }: { proposalId: string; initialStatus: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function changeStatus(next: Status) {
    if (next === status) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch("/api/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: proposalId, status: next }),
      });
      if (res.ok) setStatus(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className={`text-xs px-2 py-1 rounded-full font-medium transition-opacity ${STATUS_STYLES[status]} ${loading ? "opacity-50" : "hover:opacity-80 cursor-pointer"}`}
      >
        {status}
        <span className="ml-1 opacity-60">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[130px]">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => changeStatus(opt)}
                className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 ${opt === status ? "bg-gray-50" : ""}`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${opt === "draft" ? "bg-gray-400" : opt === "sent" ? "bg-blue-500" : opt === "accepted" ? "bg-green-500" : "bg-red-500"}`} />
                {opt}
                {opt === status && <span className="ml-auto text-gray-400">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
