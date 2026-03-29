"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { getTemplateById } from "@/lib/templates";
import PrintButton from "@/components/PrintButton";
import type { Proposal, Template } from "@/types";

export default function EditorPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Signature fields stored separately so they're always editable
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("proposals").select("*").eq("id", proposalId).single().then(({ data, error }) => {
      if (error || !data) { router.push("/dashboard"); return; }
      setProposal(data as Proposal);
      const c = data.content as Record<string, string>;
      setContent(c);
      setTitle(data.title);
      setTemplate(getTemplateById(data.template_id) ?? null);
      // Pre-fill signature fields from existing content
      setSignerName(c.yourName || c.freelancerName || c.agencyName || c.consultantName || c.vendor || c.planner || c.party1 || "");
      setClientName(c.clientName || c.preparedFor || c.party2 || "");
      setLoading(false);
    });
  }, [proposalId, router]);

  const save = useCallback(async (overrideContent?: Record<string, string>) => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: proposalId, title, content: overrideContent ?? content }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setError("Network error — changes not saved");
    } finally {
      setSaving(false);
    }
  }, [proposalId, title, content]);

  function updateField(key: string, value: string) {
    setContent((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-600 text-sm">Loading proposal...</p>
      </div>
    </div>
  );

  if (!template || !proposal) return null;

  const displaySignerName = signerName || content.yourName || content.freelancerName || content.agencyName || content.consultantName || content.vendor || content.planner || content.party1 || "";
  const displayClientName = clientName || content.clientName || content.preparedFor || content.party2 || "";

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between print:hidden sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => save()}
            className="text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5 min-w-[200px]"
          />
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-600">{error}</span>}
          <span className={`text-xs transition-all ${saved ? "text-green-600" : saving ? "text-gray-400" : "text-transparent"}`}>
            {saved ? "✓ Saved" : saving ? "Saving..." : "."}
          </span>
          <button onClick={() => save()} disabled={saving} className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors print:hidden">
            Save
          </button>
          <PrintButton />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 print:p-0 grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Fields panel */}
        <div className="lg:col-span-1 print:hidden">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-lg">{template.icon}</span> Edit Fields
            </h2>
            <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {template.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={content[field.key] ?? ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      onBlur={() => save()}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={content[field.key] ?? ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      onBlur={() => save()}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}

              {/* Signature section */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Signature Block</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Your name (signer)</label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      onBlur={() => save()}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Your title / role</label>
                    <input
                      type="text"
                      value={signerTitle}
                      onChange={(e) => setSignerTitle(e.target.value)}
                      onBlur={() => save()}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. CEO, Freelancer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Client name</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      onBlur={() => save()}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Client full name"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-2 print:col-span-full">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm print:shadow-none print:rounded-none print:border-0">
            {/* Document header */}
            <div className={`bg-gradient-to-r ${template.color} p-8 print:p-10`}>
              <div className="text-white">
                <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-2">{template.category}</p>
                <h1 className="text-3xl font-black mb-1">{content.projectTitle || content.projectName || content.engagement || content.eventName || title}</h1>
                <p className="text-white/80 text-sm">
                  {displaySignerName}
                  {(content.proposalDate || content.date || content.quoteDate) && ` · ${content.proposalDate || content.date || content.quoteDate}`}
                </p>
              </div>
            </div>

            {/* Document body */}
            <div className="p-8 print:p-10 space-y-6">
              {/* To / From */}
              {(displayClientName || displaySignerName) && (
                <div className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-gray-100">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Prepared for</p>
                    <p className="font-semibold text-gray-900">{displayClientName || "—"}</p>
                  </div>
                  {(content.validUntil || content.validFor || content.duration) && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Valid until</p>
                      <p className="font-semibold text-gray-900">{content.validUntil || content.validFor || content.duration}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic sections */}
              {template.fields.filter(f => f.type === "textarea" && content[f.key]).map((field) => (
                <div key={field.key}>
                  <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-indigo-100">{field.label}</h2>
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{content[field.key]}</div>
                </div>
              ))}

              {/* Non-textarea fields grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                {template.fields.filter(f =>
                  f.type !== "textarea" &&
                  !["clientName","yourName","projectTitle","projectName","preparedFor","preparedBy","freelancerName","agencyName","consultantName","vendor","planner","party1","party2","date","proposalDate","quoteDate","startDate","eventDate","validUntil"].includes(f.key) &&
                  content[f.key]
                ).map((field) => (
                  <div key={field.key}>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{field.label}</p>
                    <p className="font-semibold text-gray-900 text-sm">{content[field.key]}</p>
                  </div>
                ))}
              </div>

              {/* Signature block */}
              <div className="mt-10 pt-8 border-t-2 border-gray-200 grid grid-cols-2 gap-10 print:mt-16">
                <div>
                  <div className="border-b-2 border-gray-900 mb-3 pb-10" />
                  <p className="text-sm font-bold text-gray-900">{displaySignerName || "Authorized Signature"}</p>
                  {signerTitle && <p className="text-xs text-gray-500 mt-0.5">{signerTitle}</p>}
                  <p className="text-xs text-gray-400 mt-1">Date: _______________</p>
                </div>
                <div>
                  <div className="border-b-2 border-gray-400 mb-3 pb-10" />
                  <p className="text-sm font-bold text-gray-700">{displayClientName || "Client Signature"}</p>
                  <p className="text-xs text-gray-400 mt-1">Date: _______________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
