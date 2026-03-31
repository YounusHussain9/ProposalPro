import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase-server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getTemplateById } from "@/lib/templates";
import DeleteButton from "@/components/DeleteButton";
import ActivateProButton from "@/components/ActivateProButton";
import StatusDropdown from "@/components/StatusDropdown";
import { FREE_EXPORT_LIMIT, PRO_EXPORT_LIMIT, STRIPE_SESSION_FETCH_LIMIT, DEFAULT_PLAN } from "@/lib/constants";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ upgrade?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const upgradeSuccess = params.upgrade === "success";

  // Always ensure profile row exists for this user (covers existing users before schema was run)
  const svcInit = await createServiceClient();
  const { error: upsertProfileError } = await svcInit.from("profiles").upsert({
    id: user.id,
    email: user.email!,
    full_name: user.user_metadata?.full_name ?? null,
    plan: DEFAULT_PLAN,
  }, { onConflict: "id" });
  if (upsertProfileError) console.error("Profile upsert error:", upsertProfileError);

  // If returning from Stripe, verify payment and upgrade plan immediately
  if (upgradeSuccess) {
    try {
      const { stripe } = await import("@/lib/stripe");
      const svc = await createServiceClient();

      // 1. Check DB for a pending payment record
      const { data: payment, error: paymentFetchError } = await svc
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (paymentFetchError && paymentFetchError.code !== "PGRST116") {
        // PGRST116 = no rows found, which is expected for new users
        console.error("Payment fetch error:", paymentFetchError);
      }

      let verified = false;

      if (payment) {
        if (payment.status === "paid") {
          verified = true;
        } else if (payment.stripe_session_id) {
          const session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);
          if (session.payment_status === "paid") {
            const { error: paymentUpdateError } = await svc.from("payments").update({ status: "paid" }).eq("id", payment.id);
            if (paymentUpdateError) console.error("Payment update error:", paymentUpdateError);
            verified = true;
          }
        }
      }

      // 2. Fallback: search Stripe directly by customer ID
      if (!verified) {
        const { data: profile, error: profileFetchError } = await svc.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
        if (profileFetchError) console.error("Profile fetch error:", profileFetchError);
        if (profile?.stripe_customer_id) {
          const sessions = await stripe.checkout.sessions.list({
            customer: profile.stripe_customer_id,
            limit: STRIPE_SESSION_FETCH_LIMIT,
          });
          const paid = sessions.data.find(s => s.payment_status === "paid");
          if (paid) {
            // Record the payment and upgrade
            const { error: paymentUpsertError } = await svc.from("payments").upsert({
              user_id: user.id,
              stripe_session_id: paid.id,
              amount: paid.amount_total ?? 0,
              plan: (paid.metadata?.plan_id as string) ?? "pro_lifetime",
              status: "paid",
            }, { onConflict: "stripe_session_id" });
            if (paymentUpsertError) console.error("Payment upsert error:", paymentUpsertError);
            verified = true;
          }
        }
      }

      if (verified) {
        const { error: planUpgradeError } = await svc.from("profiles").update({ plan: "pro", exports_limit: PRO_EXPORT_LIMIT }).eq("id", user.id);
        if (planUpgradeError) console.error("Plan upgrade error:", planUpgradeError);
      }
    } catch (e) {
      console.error("Payment verification error:", e);
    }
  }

  const svcFinal = await createServiceClient();
  const [{ data: profile }, { data: proposals }] = await Promise.all([
    svcFinal.from("profiles").select("*").eq("id", user.id).single(),
    svcFinal.from("proposals").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Show success only when plan is actually pro */}
        {profile?.plan === "pro" && upgradeSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            You&apos;re now on Pro! All templates are unlocked.
          </div>
        )}

        {/* Payment made but plan not yet activated */}
        {upgradeSuccess && profile?.plan !== "pro" && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 px-6 py-5 rounded-xl">
            <p className="font-semibold mb-1">Payment received — activating your Pro plan...</p>
            <p className="text-sm text-amber-700 mb-4">Your Stripe payment was recorded but your plan hasn&apos;t been activated yet. Click below to activate it now.</p>
            <ActivateProButton />
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
              <div className="text-3xl font-bold text-gray-900">{profile?.plan === "pro" ? "∞" : `${profile?.exports_used ?? 0}/${profile?.exports_limit ?? FREE_EXPORT_LIMIT}`}</div>
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
                      <StatusDropdown proposalId={p.id} initialStatus={p.status as "draft" | "sent" | "accepted" | "declined"} />
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
