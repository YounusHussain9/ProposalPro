"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TemplateCard from "@/components/TemplateCard";
import CustomTemplateBuilder from "@/components/CustomTemplateBuilder";
import { TEMPLATES } from "@/lib/templates";

interface CustomTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  fields: { key: string; label: string; type: string; placeholder: string }[];
  created_at: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const fetchCustomTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/custom-templates");
      if (res.ok) {
        const data = await res.json();
        setCustomTemplates(data.templates ?? []);
      }
    } catch {
      // unauthenticated — no custom templates shown
    }
  }, []);

  useEffect(() => {
    fetchCustomTemplates();
  }, [fetchCustomTemplates]);

  async function handleDeleteCustom(id: string) {
    if (!confirm("Delete this custom template?")) return;
    setDeletingId(id);
    try {
      await fetch("/api/custom-templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUseCustom(template: CustomTemplate) {
    setCreatingId(template.id);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: `custom_${template.id}`,
          customTemplate: template,
        }),
      });
      const data = await res.json();
      if (data.proposal) {
        router.push(`/editor/${data.proposal.id}`);
      } else {
        alert(data.error || "Error creating proposal");
        setCreatingId(null);
      }
    } catch {
      alert("Network error");
      setCreatingId(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Proposal Templates</h1>
          <p className="text-gray-600">Choose a template to get started. Free templates included — no signup required.</p>
        </div>

        {/* My Templates */}
        {customTemplates.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Templates</h2>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">Custom</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {customTemplates.map((template) => (
                <div key={template.id} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all">
                  {/* Thumbnail */}
                  <div className={`h-40 bg-gradient-to-br ${template.color} flex items-center justify-center relative`}>
                    <span className="text-5xl">{template.icon}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCustom(template.id); }}
                      disabled={deletingId === template.id}
                      className="absolute top-3 right-3 bg-white/90 text-red-500 hover:text-red-700 p-1.5 rounded-full shadow transition-colors disabled:opacity-50"
                      title="Delete template"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {/* Info */}
                  <div className="p-5">
                    <div className="mb-2">
                      <span className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Custom</span>
                      <h3 className="font-semibold text-gray-900 mt-0.5">{template.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{template.description || "No description"}</p>
                    <button
                      onClick={() => handleUseCustom(template)}
                      disabled={creatingId === template.id}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {creatingId === template.id ? "Creating..." : "Use this template"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Free templates */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Free Templates</h2>
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">No signup needed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.filter((t) => !t.isPremium).map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>

        {/* Premium templates */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Premium Templates</h2>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">Pro plan</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.filter((t) => t.isPremium).map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>

        {/* Create your own template card */}
        <div className="mt-4">
          <button
            onClick={() => setShowBuilder(true)}
            className="w-full sm:w-auto flex items-center gap-3 px-6 py-4 border-2 border-dashed border-indigo-300 rounded-2xl text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Create your own template</p>
              <p className="text-xs text-indigo-400">Build a custom template with your own fields</p>
            </div>
          </button>
        </div>
      </main>
      <Footer />

      {showBuilder && (
        <CustomTemplateBuilder
          onClose={() => setShowBuilder(false)}
          onCreated={() => {
            setShowBuilder(false);
            fetchCustomTemplates();
          }}
        />
      )}
    </div>
  );
}
