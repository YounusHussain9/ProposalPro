"use client";
import { useState } from "react";
import type { TemplateField } from "@/types";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const ICON_OPTIONS = ["📄", "💼", "🤝", "📊", "🎨", "🚀", "💡", "🏗️", "📝", "⚡"];

const COLOR_OPTIONS = [
  { label: "Indigo", value: "from-indigo-500 to-indigo-700" },
  { label: "Blue", value: "from-blue-500 to-blue-700" },
  { label: "Purple", value: "from-purple-500 to-purple-700" },
  { label: "Emerald", value: "from-emerald-500 to-emerald-700" },
  { label: "Orange", value: "from-orange-500 to-orange-700" },
  { label: "Gray", value: "from-gray-500 to-gray-700" },
];

type FieldDraft = { label: string; type: TemplateField["type"] };

export default function CustomTemplateBuilder({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📄");
  const [color, setColor] = useState("from-indigo-500 to-indigo-700");
  const [fields, setFields] = useState<FieldDraft[]>([{ label: "", type: "text" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addField() {
    setFields((prev) => [...prev, { label: "", type: "text" }]);
  }

  function updateField(index: number, patch: Partial<FieldDraft>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate() {
    setError("");
    if (!title.trim()) { setError("Title is required."); return; }
    const validFields = fields.filter((f) => f.label.trim());
    if (validFields.length === 0) { setError("At least one field with a label is required."); return; }

    const apiFields: TemplateField[] = validFields.map((f, i) => ({
      key: `field_${i}_${f.label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`,
      label: f.label.trim(),
      type: f.type,
      placeholder: `Enter ${f.label.toLowerCase()}...`,
    }));

    setSaving(true);
    try {
      const res = await fetch("/api/custom-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), icon, color, fields: apiFields }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create template"); setSaving(false); return; }
      onCreated();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Create Custom Template</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Template Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Consulting Agreement"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Short description of the template"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIcon(em)}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${icon === em ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-8 px-3 rounded-lg text-white text-xs font-semibold bg-gradient-to-r ${c.value} border-2 transition-all ${color === c.value ? "border-white scale-105" : "border-transparent"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Fields *</label>
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(i, { label: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Field ${i + 1} label`}
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(i, { type: e.target.value as TemplateField["type"] })}
                    className="px-2 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="date">Date</option>
                    <option value="number">Number</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeField(i)}
                    disabled={fields.length === 1}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                    title="Remove field"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addField}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add field
            </button>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
