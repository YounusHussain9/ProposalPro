"use client";
import { useState, useRef, useEffect } from "react";

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
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  function toggle() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX });
    }
    setOpen((o) => !o);
  }

  // Close on scroll/resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open]);

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
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={loading}
        className={`text-xs px-2 py-1 rounded-full font-medium transition-opacity ${STATUS_STYLES[status]} ${loading ? "opacity-50" : "hover:opacity-80 cursor-pointer"}`}
      >
        {status}
        <span className="ml-1 opacity-60">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[130px]"
            style={{ top: pos.top, left: pos.left }}
          >
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
    </>
  );
}
