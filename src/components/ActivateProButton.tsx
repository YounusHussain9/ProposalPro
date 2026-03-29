"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ActivateProButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function activate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/verify-payment", { method: "POST" });
      const data = await res.json();
      if (data.upgraded) {
        router.refresh();
      } else {
        setError(data.error || "No paid Stripe session found for your account. Contact support if you believe this is wrong.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={activate}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm disabled:opacity-60"
      >
        {loading ? (
          <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying payment...</>
        ) : (
          <>⭐ Activate Pro now</>
        )}
      </button>
      {error && <p className="text-xs text-red-600 max-w-xs">{error}</p>}
    </div>
  );
}
