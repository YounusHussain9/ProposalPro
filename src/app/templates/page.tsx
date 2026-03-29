import { createClient } from "@/lib/supabase-server";
import { TEMPLATES } from "@/lib/templates";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TemplateCard from "@/components/TemplateCard";

export default async function TemplatesPage() {
  let userPlan = "free";
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      userPlan = data?.plan ?? "free";
    }
  } catch {}

  const categories = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Proposal Templates</h1>
          <p className="text-gray-600">Choose a template to get started. Free templates included — no signup required.</p>
        </div>

        {/* Free templates */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Free Templates</h2>
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">No signup needed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.filter((t) => !t.isPremium).map((template) => (
              <TemplateCard key={template.id} template={template} userPlan={userPlan} />
            ))}
          </div>
        </div>

        {/* Premium templates */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Premium Templates</h2>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">Pro plan</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.filter((t) => t.isPremium).map((template) => (
              <TemplateCard key={template.id} template={template} userPlan={userPlan} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
