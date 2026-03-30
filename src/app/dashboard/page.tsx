import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase-server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getTemplateById } from "@/lib/templates";
import DeleteButton from "@/components/DeleteButton";
import ActivateProButton from "@/components/ActivateProButton";
import StatusDropdown from "@/components/StatusDropdown";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ upgrade?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const upgradeSuccess = params.upgrade === "success";

  // Always ensure profile row exists for this user (covers existing users before schema was run)
  const svcInit = await createServiceClient();
  await svcInit.from("profiles").upsert({
    id: user.id,
    email: user.email!,
    full_name: user.user_metadata?.full_name ?? null,
  }, { onConflict: "id", ignoreDuplicates: true });

  // If returning from Stripe, verify payment and upgrade plan immediately
  if (upgradeSuccess) {
    try {
      const { stripe } = await import("@/lib/stripe");
      const svc = await createServiceClient();

      // 1. Check DB for a pending payment record
      const { data: payment } = await svc
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let verified = false;

      if (payment) {
        if (payment.status === "paid") {
          verified = true;
        } else if (payment.stripe_session_id) {
          const session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);
          if (session.payment_status === "paid") {
            await svc.from("payments").update({ status: "paid" }).eq("id", payment.id);
            verified = true;
          }
        }
      }

      // 2. Fallback: search Stripe directly by customer ID
      if (!verified) {
        const { data: profile } = await svc.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
        if (profile?.stripe_customer_id) {
          const sessions = await stripe.checkout.sessions.list({
            customer: profile.stripe_customer_id,
            limit: 5,
          });
          const paid = sessions.data.find(s => s.payment_status === "paid");
          if (paid) {
            // Record the payment and upgrade
            await svc.from("payments").upsert({
              user_id: user.id,
              stripe_session_id: paid.id,
              amount: paid.amount_total ?? 0,
              plan: (paid.metadata?.plan_id as string) ?? "pro_lifetime",
              status: "paid",
            }, { onConflict: "stripe_session_id", ignoreDuplicates: true });
            verified = true;
          }
        }
      }

      if (verified) {
        await svc.from("profiles").update({ plan: "pro", exports_limit: 999 }).eq("id", user.id);
      }
    } catch (e) {
      console.error("Payment verification error:", e);
    }
  }

  const svcFinal = await createServiceClient();
  const [{ data: profile }, { data: proposals }, { data: allProposalsForChart }] = await Promise.all([
    svcFinal.from("profiles").select("*").eq("id", user.id).single(),
    svcFinal.from("proposals").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    svcFinal.from("proposals").select("template_id"),
  ]);

  const templateCounts = (allProposalsForChart ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.template_id] = (acc[p.template_id] ?? 0) + 1;
    return acc;
  }, {});
  const templateStats = Object.entries(templateCounts)
    .map(([template_id, count]) => ({ template_id, count }))
    .sort((a, b) => b.count - a.count);
  const maxCount = templateStats[0]?.count ?? 1;

  function getTemplateLabel(id: string): string {
    const t = getTemplateById(id);
    if (t) return t.title;
    if (id.startsWith("custom_")) return "Custom Template";
    return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const BAR_COLORS = ["bg-indigo-500","bg-purple-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-cyan-500"];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {profile?.plan === "pro" && upgradeSuccess && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400 px-6 py-4 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            You&apos;re now on Pro! All templates are unlocked.
          </div>
        )}

        {upgradeSuccess && profile?.plan !== "pro" && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-400 px-6 py-5 rounded-xl">
            <p className="font-semibold mb-1">Payment received — activating your Pro plan...</p>
            <p className="text-sm text-amber-700 dark:text-amber-500 mb-4">Your Stripe payment was recorded but your plan hasn&apos;t been activated yet. Click below to activate it now.</p>
            <ActivateProButton />
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Welcome back, {profile?.full_name || user.email}</p>
          </div>
          <Link href="/templates" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New proposal
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-3xl font-bold text-indigo-600 mb-1">{proposals?.length ?? 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total proposals</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">{profile?.plan === "pro" ? "∞" : `${profile?.exports_used ?? 0}/${profile?.exports_limit ?? 3}`}</div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Exports used</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${profile?.plan === "pro" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
                {profile?.plan === "pro" ? "⭐ Pro" : "Free"}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current plan</div>
            {profile?.plan !== "pro" && <Link href="/pricing" className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 mt-1 inline-block">Upgrade to Pro →</Link>}
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-gray-50">My Proposals</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{proposals?.length ?? 0} proposals</span>
          </div>
          {!proposals || proposals.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">No proposals yet</p>
              <Link href="/templates" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-700 dark:hover:text-indigo-300">Browse templates to get started →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {proposals.map((p) => {
                const tmpl = getTemplateById(p.template_id);
                return (
                  <div key={p.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tmpl?.color ?? "from-gray-400 to-gray-600"} flex items-center justify-center text-lg flex-shrink-0`}>
                      {tmpl?.icon ?? "📄"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{p.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tmpl?.category ?? ""} · {new Date(p.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusDropdown proposalId={p.id} initialStatus={p.status as "draft" | "sent" | "accepted" | "declined"} />
                      <Link href={`/editor/${p.id}`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">Edit</Link>
                      <DeleteButton proposalId={p.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {templateStats.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-50">Template Usage</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Most-used templates across all proposals</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {templateStats.map(({ template_id, count }, i) => {
                const pct = Math.round((count / maxCount) * 100);
                const color = BAR_COLORS[i % BAR_COLORS.length];
                return (
                  <div key={template_id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{getTemplateLabel(template_id)}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-50 tabular-nums">{count} {count === 1 ? "proposal" : "proposals"}</span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
