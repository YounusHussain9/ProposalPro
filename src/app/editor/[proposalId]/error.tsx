"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[EditorError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Editor failed to load</h1>
            <p className="text-sm text-gray-500">Your proposal data is safe in the database.</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-red-700 font-medium">
            {error.message || "An unexpected error occurred while loading the editor."}
          </p>
          {error.digest && (
            <p className="text-xs text-red-400 mt-1 font-mono">ID: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Reload editor
          </button>
          <Link
            href="/dashboard"
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
