import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const server = new McpServer({
  name: "proposalpro-stats",
  version: "1.0.0",
});

server.tool("get_overview", "Total proposals, users, exports used, and revenue", {}, async () => {
  const [
    { count: totalProposals },
    { count: totalUsers },
    { data: profiles },
    { data: payments },
  ] = await Promise.all([
    supabase.from("proposals").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("exports_used, plan"),
    supabase.from("payments").select("amount, status").eq("status", "paid"),
  ]);

  const totalExports = (profiles ?? []).reduce((sum, p) => sum + (p.exports_used ?? 0), 0);
  const proUsers = (profiles ?? []).filter((p) => p.plan === "pro").length;
  const revenue = (payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0) / 100;

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          { totalProposals, totalUsers, proUsers, totalExports, revenueUSD: revenue.toFixed(2) },
          null,
          2
        ),
      },
    ],
  };
});

server.tool("get_template_usage", "Count of proposals per template, sorted by most used", {}, async () => {
  const { data } = await supabase.from("proposals").select("template_id");
  const counts = (data ?? []).reduce((acc, p) => {
    acc[p.template_id] = (acc[p.template_id] ?? 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(counts)
    .map(([template_id, count]) => ({ template_id, count }))
    .sort((a, b) => b.count - a.count);

  return {
    content: [{ type: "text", text: JSON.stringify(sorted, null, 2) }],
  };
});

server.tool("get_recent_signups", "Last 10 user signups with email, plan, and created_at", {}, async () => {
  const { data } = await supabase
    .from("profiles")
    .select("email, plan, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
  };
});

server.tool("get_proposal_statuses", "Count of proposals by status (draft/sent/accepted/declined)", {}, async () => {
  const { data } = await supabase.from("proposals").select("status");
  const counts = (data ?? []).reduce((acc, p) => {
    const s = p.status ?? "draft";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return {
    content: [{ type: "text", text: JSON.stringify(counts, null, 2) }],
  };
});

server.tool("get_top_users", "Top 5 users by number of proposals, with email and plan", {}, async () => {
  const { data: proposals } = await supabase.from("proposals").select("user_id");
  const { data: profiles } = await supabase.from("profiles").select("id, email, plan");

  const countByUser = (proposals ?? []).reduce((acc, p) => {
    acc[p.user_id] = (acc[p.user_id] ?? 0) + 1;
    return acc;
  }, {});

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const top = Object.entries(countByUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([user_id, count]) => ({
      email: profileMap[user_id]?.email ?? user_id,
      plan: profileMap[user_id]?.plan ?? "unknown",
      proposals: count,
    }));

  return {
    content: [{ type: "text", text: JSON.stringify(top, null, 2) }],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
