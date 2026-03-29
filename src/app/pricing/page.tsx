"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase-browser";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<"free" | "pro" | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setIsLoggedIn(true);
      const { data: profile } = await supabase.from("profiles").select("plan").eq("id", data.user.id).single();
      setUserPlan(profile?.plan ?? "free");
    });
  }, []);

  async function handleUpgrade(planId: string) {
    setError("");
    setLoading(planId);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/signup?next=/pricing"); return; }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(null);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(null);
    }
  }

  const isPro = userPlan === "pro";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gray-50 py-16 text-center border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Simple, honest pricing</h1>
            <p className="text-lg text-gray-600">Start free. Upgrade when you need more templates and exports.</p>
            {isPro && (
              <div className="mt-6 inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-full font-semibold text-sm">
                ⭐ You&apos;re on Pro — all features unlocked
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="max-w-4xl mx-auto px-4 pt-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          </div>
        )}

        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Free */}
            <div className={`bg-white border-2 rounded-2xl p-8 ${!isPro && isLoggedIn ? "border-indigo-200" : "border-gray-200"}`}>
              {!isPro && isLoggedIn && (
                <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3">Current plan</div>
              )}
              <h3 className="text-lg font-bold text-gray-900 mb-1">Free</h3>
              <div className="text-4xl font-black text-gray-900 mb-1">$0</div>
              <p className="text-gray-500 text-sm mb-6">Forever free</p>
              <ul className="space-y-3 text-sm mb-8">
                {["3 free templates", "3 PDF exports/month", "Rich text editor", "Dashboard access"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-700"><svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{f}</li>
                ))}
              </ul>
              {isLoggedIn ? (
                <Link href="/dashboard" className="block text-center py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                  Go to dashboard
                </Link>
              ) : (
                <Link href="/auth/signup" className="block text-center py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                  Get started free
                </Link>
              )}
            </div>

            {/* Pro Monthly */}
            <div className="bg-indigo-600 border-2 border-indigo-600 rounded-2xl p-8 relative">
              {isPro ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-green-700 text-xs font-bold px-4 py-1.5 rounded-full border border-green-200">⭐ Your plan</div>
              ) : (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-indigo-700 text-xs font-bold px-4 py-1.5 rounded-full border border-indigo-200">Most popular</div>
              )}
              <h3 className="text-lg font-bold text-white mb-1">Pro Monthly</h3>
              <div className="text-4xl font-black text-white mb-1">$12<span className="text-lg font-normal text-indigo-200">/mo</span></div>
              <p className="text-indigo-200 text-sm mb-6">Cancel anytime</p>
              <ul className="space-y-3 text-sm mb-8">
                {["All 10+ templates", "Unlimited exports", "Priority support", "New templates monthly"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-indigo-100"><svg className="w-4 h-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{f}</li>
                ))}
              </ul>
              {isPro ? (
                <div className="block w-full text-center py-3 bg-white/20 text-white rounded-xl font-semibold cursor-default">
                  ✓ Active
                </div>
              ) : (
                <button onClick={() => handleUpgrade("pro_monthly")} disabled={loading !== null} className="block w-full text-center py-3 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50">
                  {loading === "pro_monthly" ? "Redirecting..." : "Upgrade to Pro"}
                </button>
              )}
            </div>

            {/* Pro Lifetime */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Pro Lifetime</h3>
              <div className="text-4xl font-black text-gray-900 mb-1">$29</div>
              <p className="text-gray-500 text-sm mb-6">Pay once, use forever</p>
              <ul className="space-y-3 text-sm mb-8">
                {["Everything in Pro Monthly", "Lifetime access", "All future templates", "No recurring fees"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-700"><svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{f}</li>
                ))}
              </ul>
              {isPro ? (
                <div className="block w-full text-center py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold cursor-default">
                  Already on Pro
                </div>
              ) : (
                <button onClick={() => handleUpgrade("pro_lifetime")} disabled={loading !== null} className="block w-full text-center py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
                  {loading === "pro_lifetime" ? "Redirecting..." : "Buy Lifetime Access"}
                </button>
              )}
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">FAQ</h2>
            <div className="space-y-6">
              {[
                { q: "What does one export mean?", a: "Each time you download/print a proposal as PDF, it counts as one export. Free plan includes 3 exports per month." },
                { q: "Can I try premium templates before upgrading?", a: "You can preview all templates in the library. Upgrading to Pro unlocks all 10+ templates instantly." },
                { q: "What payment methods are accepted?", a: "All major credit and debit cards via Stripe. Secure and encrypted." },
                { q: "Can I cancel my Pro Monthly subscription?", a: "Yes, cancel any time from your account. You keep Pro access until the end of your billing period." },
              ].map((item) => (
                <div key={item.q} className="border-b border-gray-100 pb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                  <p className="text-gray-600 text-sm">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
