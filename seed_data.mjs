import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Updating Project Details...");
  const { data: details } = await supabase.from('project_details').select('id').limit(1).single();
  if (details) {
    await supabase.from('project_details').update({ total_budget: 40000, amount_paid: 12000 }).eq('id', details.id);
  }

  console.log("Clearing old phases and todos...");
  await supabase.from('phases').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // hack to delete all
  await supabase.from('todos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("Inserting new phases...");
  const phases = [
    { name: 'Phase 1 — Initiation & Planning', status: 'completed', progress: 100, milestone_amount: '₹12,000', weeks: 'Week 1', order_index: 1 },
    { name: 'Phase 2 — Auth & Inventory UI', status: 'pending', progress: 0, milestone_amount: '₹12,000', weeks: 'Week 1–2', order_index: 2 },
    { name: 'Phase 3 — Sales, Purchase & Expense', status: 'pending', progress: 0, milestone_amount: '₹8,000', weeks: 'Week 2–3', order_index: 3 },
    { name: 'Phase 4 — Testing, Deployment & Handover', status: 'pending', progress: 0, milestone_amount: '₹8,000', weeks: 'Final Week', order_index: 4 }
  ];
  await supabase.from('phases').insert(phases);

  console.log("Inserting new todos...");
  const todos = [
    "Share signed proposal copy with Swati via portal",
    "Confirm VPS plan selection (KVM 1/2/4) — client decision required",
    "Collect domain name and DNS access credentials",
    "Finalize DB schema & system architecture doc",
    "Create wireframes for all modules (Dashboard, Inventory, Sales, Purchase, Expense, Auth)",
    "Get wireframe approval from client (5 business day window)",
    "Set up GitLab repo with branch strategy (main, dev, feature/*)",
    "Initialize React + Node.js project scaffolding",
    "Set up PostgreSQL DB on local dev environment",
    "Client portal live (Supabase-connected, no demo data)",
    "Send portal login credentials to Swati via secure message",
    "Implement multi-tenant architecture (company onboarding, data isolation)",
    "Build auth system: email/password login + Google OAuth (SSO)",
    "Confirm Google Workspace admin access from client (for OAuth config)",
    "Implement 3 role system: Super Admin, Shop Admin, Floor Manager",
    "Session management + password reset flow",
    "Build main dashboard UI (role-aware views per scope)",
    "Product management module (add, edit, delete, categorize)",
    "Category management (multi-category per product confirmed by client)",
    "Stock tracking & inventory adjustment flows",
    "Inventory reports page (filterable, exportable)",
    "Company settings management panel",
    "Multi-language architecture scaffold (English + Spanish at minimum)",
    "Schedule Phase 2 demo meeting with client (via portal)",
    "Demo login system + inventory module to Swati; get approval",
    "Collect Phase 2 payment (₹12,000) after demo sign-off",
    "Sales creation flow (invoice generation, line items, discounts)",
    "Customer records management",
    "Invoice PDF generation",
    "Sales reports (by period, by customer, by product)",
    "Supplier management module",
    "Purchase records & purchase order flow",
    "Purchase reports",
    "Expense recording (by category, date, notes)",
    "Expense categorization & tagging",
    "Expense reports",
    "Admin dashboard: tenant monitoring + user management + activity tracking",
    "Subscription management panel for Super Admin",
    "Client review of Sales + Purchase + Expense modules (get written sign-off)",
    "Collect Phase 3 payment (₹8,000) after sign-off",
    "Begin 5-page CarittoPro business website build",
    "Website: Home + About + Services + Contact + 1 more page (confirm with client)",
    "Website: mobile responsive + contact form + Spanish language",
    "Full QA pass: all modules, all 3 roles, edge cases",
    "Security audit: no critical/high severity vulnerabilities at handover",
    "Input validation, auth checks, secure session handling review",
    "VPS provisioning: OS, Nginx, Node, PostgreSQL setup",
    "Confirm VPS registered under client email (root access to client)",
    "SSL/TLS cert config for all production domains",
    "Staging environment deploy + smoke test",
    "Production deploy + final smoke test",
    "Enable Hostinger Auto Backup (₹269/mo — client subscribes)",
    "GitLab mirror sync — confirm code backup active",
    "Website SSL config + basic SEO setup + go-live",
    "Client portal: update all phase progress to 100%",
    "Technical documentation: system architecture + DB schema + API docs",
    "User/admin guide for platform operation",
    "Deployment & environment setup docs",
    "Handover session with Swati: walkthrough of all modules + admin access transfer",
    "Collect final payment (₹8,000)",
    "Confirm 1-month post-handover support window starts today",
    "Offer maintenance plan options (20% annual / 2% monthly)",
    "Share VPS hosting environment specs doc with client",
    "Tag final GitLab release (v1.0.0)",
    "Send project close-out summary email to Swati"
  ].map(t => ({ text: t }));
  
  await supabase.from('todos').insert(todos);
  
  console.log("Done.");
}

seed();
