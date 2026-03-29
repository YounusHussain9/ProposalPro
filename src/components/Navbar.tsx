"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/"); router.refresh();
  }

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <span className="text-xl font-bold text-gray-900">ProposalPro</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/templates" className={`text-sm transition-colors ${isActive("/templates") ? "text-indigo-600 font-medium" : "text-gray-600 hover:text-gray-900"}`}>Templates</Link>
            <Link href="/pricing" className={`text-sm transition-colors ${isActive("/pricing") ? "text-indigo-600 font-medium" : "text-gray-600 hover:text-gray-900"}`}>Pricing</Link>
            {user ? (
              <>
                <Link href="/dashboard" className={`text-sm transition-colors ${isActive("/dashboard") ? "text-indigo-600 font-medium" : "text-gray-600 hover:text-gray-900"}`}>Dashboard</Link>
                <button onClick={signOut} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Log in</Link>
                <Link href="/auth/signup" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">Get started free</Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">{menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-3">
            <Link href="/templates" className="block text-sm text-gray-600 py-2">Templates</Link>
            <Link href="/pricing" className="block text-sm text-gray-600 py-2">Pricing</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block text-sm text-gray-600 py-2">Dashboard</Link>
                <button onClick={signOut} className="block text-sm text-gray-600 py-2 w-full text-left">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block text-sm text-gray-600 py-2">Log in</Link>
                <Link href="/auth/signup" className="block text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg text-center">Get started free</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
