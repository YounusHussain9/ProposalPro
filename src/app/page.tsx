import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const features = [
  { icon: "📋", title: "10+ Professional Templates", desc: "Business, sales, freelance, and more. Pre-written content you can customize in minutes." },
  { icon: "✏️", title: "Rich Text Editor", desc: "Edit every section with our intuitive editor. Format text, add lists, and personalize your proposal." },
  { icon: "📄", title: "PDF Export", desc: "Download your proposal as a clean, print-ready PDF with one click. Share or email instantly." },
  { icon: "💼", title: "Client-Ready Design", desc: "Every template is professionally designed to impress. First impressions that win deals." },
  { icon: "⚡", title: "Ready in Minutes", desc: "Fill in your details, customize the content, and send. No design skills required." },
  { icon: "🔒", title: "Secure & Private", desc: "Your proposals are stored securely. Only you can access your documents." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-24 lg:py-36">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            3 free proposals — no credit card required
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-tight mb-6">
            Create winning proposals<br />
            <span className="text-indigo-600">in minutes</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Choose from 10+ professional templates, customize your content, and download a PDF proposal that closes deals — no design skills needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/templates" className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              Browse templates
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 border border-gray-200 transition-colors">
              Sign up free
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">No credit card required · 3 free proposals</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-600">From blank page to sent proposal in 3 steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Pick a template", desc: "Browse our library of professionally designed proposal templates for every use case." },
              { step: "2", title: "Customize content", desc: "Fill in your details and edit the pre-written sections with our easy rich text editor." },
              { step: "3", title: "Download & send", desc: "Export as a PDF and send to your client. Close more deals faster." },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4">{s.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Everything you need to win clients</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-white">
          {[
            { value: "10+", label: "Professional templates" },
            { value: "3", label: "Free proposals included" },
            { value: "5 min", label: "Average time to create" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-5xl font-black mb-2">{s.value}</div>
              <div className="text-indigo-200">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple pricing</h2>
          <p className="text-lg text-gray-600 mb-10">Start free. Upgrade when you need more.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-left">
              <div className="text-2xl font-bold text-gray-900 mb-1">Free</div>
              <div className="text-gray-500 text-sm mb-6">Forever free</div>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-green-600">✓</span> 3 free templates</li>
                <li className="flex gap-2"><span className="text-green-600">✓</span> 3 PDF exports</li>
                <li className="flex gap-2"><span className="text-green-600">✓</span> Rich text editor</li>
              </ul>
            </div>
            <div className="bg-indigo-600 rounded-2xl p-8 text-left text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Popular</div>
              <div className="text-2xl font-bold mb-1">Pro — $12<span className="text-lg font-normal text-indigo-200">/mo</span></div>
              <div className="text-indigo-200 text-sm mb-6">or $29 one-time</div>
              <ul className="space-y-3 text-sm text-indigo-100">
                <li className="flex gap-2"><span className="text-white">✓</span> All 10+ templates</li>
                <li className="flex gap-2"><span className="text-white">✓</span> Unlimited exports</li>
                <li className="flex gap-2"><span className="text-white">✓</span> Priority support</li>
              </ul>
            </div>
          </div>
          <Link href="/pricing" className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700">View full pricing details →</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Start creating proposals today</h2>
          <p className="text-lg text-gray-400 mb-8">Free to start. No credit card. 3 proposals on us.</p>
          <Link href="/templates" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-500 transition-colors">
            Browse templates — it&apos;s free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
