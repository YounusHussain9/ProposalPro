"use client";
import { useState } from "react";
import Link from "next/link";

export default function PrintButton({ proposalTitle, proposalId }: { proposalTitle?: string; proposalId?: string }) {
  const [limitReached, setLimitReached] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handlePrint() {
    setChecking(true);
    try {
      const res = await fetch("/api/track-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: proposalTitle, id: proposalId }),
      });

      if (res.status === 403) {
        setLimitReached(true);
        setChecking(false);
        return;
      }

      window.print();
    } catch {
      // On network error, allow print anyway
      window.print();
    } finally {
      setChecking(false);
    }
  }

  if (limitReached) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Export limit reached</h3>
        <p className="text-sm text-gray-600 mb-6">You&apos;ve used all your free exports. Upgrade to Pro for unlimited PDF downloads.</p>
        <div className="flex gap-3">
          <button
            onClick={() => setLimitReached(false)}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <Link
            href="/pricing"
            className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-center"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <button
      onClick={handlePrint}
      disabled={checking}
      className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm print:hidden disabled:opacity-60"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      {checking ? "Checking..." : "Download PDF"}
    </button>
  );
}
