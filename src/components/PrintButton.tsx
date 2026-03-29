"use client";
export default function PrintButton({ proposalTitle }: { proposalTitle?: string }) {
  async function handlePrint() {
    // Fire-and-forget: track export + notify owner
    fetch("/api/track-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: proposalTitle }),
    }).catch(() => {});
    window.print();
  }

  return (
    <button onClick={handlePrint} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm print:hidden">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
      Download PDF
    </button>
  );
}
