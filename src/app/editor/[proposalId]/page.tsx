"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { getTemplateById } from "@/lib/templates";
import PrintButton from "@/components/PrintButton";
import SignaturePad from "@/components/SignaturePad";
import type { Proposal, Template, TemplateField } from "@/types";

export default function EditorPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [customFields, setCustomFields] = useState<TemplateField[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Signature fields
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [signatureImage, setSignatureImage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("proposals").select("*").eq("id", proposalId).single().then(async ({ data, error }) => {
      if (error || !data) { router.push("/dashboard"); return; }
      setProposal(data as Proposal);
      const c = data.content as Record<string, string>;
      setContent(c);
      setTitle(data.title);

      const templateId: string = data.template_id;

      if (templateId.startsWith("custom_")) {
        // Fetch the custom template fields from the API
        const customId = templateId.replace("custom_", "");
        try {
          const res = await fetch("/api/custom-templates");
          if (res.ok) {
            const json = await res.json();
            const found = (json.templates ?? []).find((t: { id: string }) => t.id === customId);
            if (found) {
              // Build a synthetic Template object so the rest of the editor works unchanged
              const synth: Template = {
                id: templateId,
                title: found.title,
                description: found.description ?? "",
                category: "Custom",
                isPremium: false,
                color: found.color,
                icon: found.icon,
                fields: found.fields as TemplateField[],
                defaultContent: {},
              };
              setTemplate(synth);
              setCustomFields(found.fields as TemplateField[]);
            }
          }
        } catch {
          // ignore, fall through
        }
      } else {
        setTemplate(getTemplateById(templateId) ?? null);
      }

      // Pre-fill signature fields from existing content
      setSignerName(c.yourName || c.freelancerName || c.agencyName || c.consultantName || c.vendor || c.planner || c.party1 || "");
      setClientName(c.clientName || c.preparedFor || c.party2 || "");
      if (c.__signatureImage) setSignatureImage(c.__signatureImage);
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

  // Use custom fields if this is a custom template, else use built-in template fields
  const activeFields: TemplateField[] = template.id.startsWith("custom_") ? customFields : template.fields;

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
          <PrintButton proposalTitle={title} />
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
              {activeFields.map((field) => (
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
                  <SignaturePad
                    label="Your digital signature"
                    value={signatureImage}
                    onChange={(dataUrl) => {
                      setSignatureImage(dataUrl);
                      const updated = { ...content, __signatureImage: dataUrl };
                      setContent(updated);
                      save(updated);
                    }}
                  />
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
              <div className="flex items-start justify-between">
                <div className="text-white flex-1">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">{template.category}</p>
                  <h1 className="text-3xl font-black mb-2 leading-tight">{content.projectTitle || content.projectName || content.engagement || content.eventName || title}</h1>
                  <p className="text-white/80 text-sm">
                    {displaySignerName}
                    {(content.proposalDate || content.date || content.quoteDate) && ` · ${content.proposalDate || content.date || content.quoteDate}`}
                  </p>
                </div>
                {/* Branding logo */}
                <div className="ml-6 flex-shrink-0 bg-white/20 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-white/80 text-xs font-bold mt-1 text-center">ProposalPro</p>
                </div>
              </div>
            </div>

            {/* To / From info bar */}
            {(displayClientName || displaySignerName || content.validUntil || content.validFor) && (
              <div className="bg-gray-50 border-b border-gray-100 px-8 py-4 flex flex-wrap gap-6">
                {displaySignerName && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">From</p>
                    <p className="font-semibold text-gray-900 text-sm">{displaySignerName}</p>
                    {signerTitle && <p className="text-xs text-gray-500">{signerTitle}</p>}
                  </div>
                )}
                {displayClientName && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Prepared for</p>
                    <p className="font-semibold text-gray-900 text-sm">{displayClientName}</p>
                  </div>
                )}
                {(content.validUntil || content.validFor) && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Valid until</p>
                    <p className="font-semibold text-gray-900 text-sm">{content.validUntil || content.validFor}</p>
                  </div>
                )}
                {(content.proposalDate || content.date || content.quoteDate) && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Date</p>
                    <p className="font-semibold text-gray-900 text-sm">{content.proposalDate || content.date || content.quoteDate}</p>
                  </div>
                )}
              </div>
            )}

            {/* Document body */}
            <div className="p-8 print:p-10 space-y-7">

              {/* Dynamic sections — textarea fields */}
              {activeFields.filter(f => f.type === "textarea" && content[f.key]).map((field, i) => (
                <div key={field.key}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 font-bold text-xs">{i + 1}</span>
                    </div>
                    <h2 className="text-base font-bold text-gray-900">{field.label}</h2>
                  </div>
                  <div className="ml-10 text-gray-600 text-sm leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    {content[field.key]}
                  </div>
                </div>
              ))}

              {/* Non-textarea fields — styled detail cards */}
              {activeFields.filter(f =>
                f.type !== "textarea" &&
                !["clientName","yourName","projectTitle","projectName","preparedFor","preparedBy","freelancerName","agencyName","consultantName","vendor","planner","party1","party2","date","proposalDate","quoteDate","startDate","eventDate","validUntil"].includes(f.key) &&
                content[f.key]
              ).length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Project Details</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {activeFields.filter(f =>
                      f.type !== "textarea" &&
                      !["clientName","yourName","projectTitle","projectName","preparedFor","preparedBy","freelancerName","agencyName","consultantName","vendor","planner","party1","party2","date","proposalDate","quoteDate","startDate","eventDate","validUntil"].includes(f.key) &&
                      content[f.key]
                    ).map((field) => (
                      <div key={field.key} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{field.label}</p>
                        <p className="font-semibold text-gray-900 text-sm">{content[field.key]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature block */}
              <div className="mt-8 pt-8 border-t-2 border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Agreed & Signed</p>
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">Authorized by</p>
                    {signatureImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={signatureImage} alt="Signature" className="h-14 mb-3 object-contain object-left" />
                    ) : (
                      <div className="border-b-2 border-gray-300 mb-4 pb-8" />
                    )}
                    <p className="text-sm font-bold text-gray-900">{displaySignerName || "Authorized Signature"}</p>
                    {signerTitle && <p className="text-xs text-gray-500 mt-0.5">{signerTitle}</p>}
                    <p className="text-xs text-gray-400 mt-2">Date: _______________</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">Client acceptance</p>
                    <div className="border-b-2 border-gray-300 mb-4 pb-8" />
                    <p className="text-sm font-bold text-gray-700">{displayClientName || "Client Signature"}</p>
                    <p className="text-xs text-gray-400 mt-2">Date: _______________</p>
                  </div>
                </div>
              </div>

              {/* Footer branding */}
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-300">Generated with ProposalPro</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-indigo-600 rounded flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">ProposalPro</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
