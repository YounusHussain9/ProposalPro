import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getTemplateById } from "@/lib/templates";
import DeleteButton from "@/components/DeleteButton";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ upgrade?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: proposals }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("proposals").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
  ]);

  const params = await searchParams;
  const upgradeSuccess = params.upgrade === "success";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {upgradeSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            You&apos;re now on Pro! All templates are unlocked.
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome back, {profile?.full_name || user.email}</p>
          </div>
          <Link href="/templates" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New proposal
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="text-3xl font-bold text-indigo-600 mb-1">{proposals?.length ?? 0}</div>
            <div className="text-sm text-gray-600">Total proposals</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-3xl font-bold text-gray-900">{profile?.plan === "pro" ? "∞" : `${profile?.exports_used ?? 0}/${profile?.exports_limit ?? 3}`}</div>
            </div>
            <div className="text-sm text-gray-600">Exports used</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${profile?.plan === "pro" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"}`}>
                {profile?.plan === "pro" ? "⭐ Pro" : "Free"}
              </div>
            </div>
            <div className="text-sm text-gray-600">Current plan</div>
            {profile?.plan !== "pro" && <Link href="/pricing" className="text-xs text-indigo-600 font-medium hover:text-indigo-700 mt-1 inline-block">Upgrade to Pro →</Link>}
          </div>
        </div>

        {/* Upgrade CTA */}
        {profile?.plan !== "pro" && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg mb-1">Unlock all 10+ templates</h3>
              <p className="text-indigo-100 text-sm">Upgrade to Pro for unlimited proposals and premium templates.</p>
            </div>
            <Link href="/pricing" className="flex-shrink-0 bg-white text-indigo-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors text-sm">Upgrade to Pro</Link>
          </div>
        )}

        {/* Proposals list */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">My Proposals</h2>
            <span className="text-sm text-gray-500">{proposals?.length ?? 0} proposals</span>
          </div>
          {!proposals || proposals.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-gray-500 font-medium mb-2">No proposals yet</p>
              <Link href="/templates" className="text-indigo-600 text-sm font-medium hover:text-indigo-700">Browse templates to get started →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {proposals.map((p) => {
                const tmpl = getTemplateById(p.template_id);
                return (
                  <div key={p.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tmpl?.color ?? "from-gray-400 to-gray-600"} flex items-center justify-center text-lg flex-shrink-0`}>
                      {tmpl?.icon ?? "📄"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{tmpl?.category ?? ""} · {new Date(p.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === "draft" ? "bg-gray-100 text-gray-600" : p.status === "sent" ? "bg-blue-100 text-blue-700" : p.status === "accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.status}</span>
                      <Link href={`/editor/${p.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">Edit</Link>
                      <DeleteButton proposalId={p.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
