"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Template } from "@/types";

export default function TemplateCard({ template, userPlan }: { template: Template; userPlan?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState("");
  const locked = template.isPremium && userPlan !== "pro";

  async function handleUse() {
    setCardError("");
    if (locked) { router.push("/pricing"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: template.id }) });
      const data = await res.json();
      if (data.proposal) router.push(`/editor/${data.proposal.id}`);
      else if (data.requiresUpgrade) router.push("/pricing");
      else { setCardError(data.error || "Something went wrong. Please try again."); setLoading(false); }
    } catch {
      setCardError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all">
      {/* Thumbnail */}
      <div className={`h-40 bg-gradient-to-br ${template.color} flex items-center justify-center relative`}>
        <span className="text-5xl">{template.icon}</span>
        {template.isPremium && (
          <div className="absolute top-3 right-3 bg-white/90 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            Premium
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wide">{template.category}</span>
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mt-0.5">{template.title}</h3>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{template.description}</p>
        {cardError && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-3 py-2 rounded-lg mb-3">{cardError}</p>
        )}
        <button onClick={handleUse} disabled={loading} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${locked ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
          {loading ? "Creating..." : locked ? "🔒 Upgrade to use" : "Use this template"}
        </button>
      </div>
    </div>
  );
}
