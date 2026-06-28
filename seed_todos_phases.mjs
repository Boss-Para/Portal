import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

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
  console.log("Renaming team_admin to Jesvin...");
  await supabase.from('profiles').update({ name: 'Jesvin' }).eq('username', 'team_admin');

  console.log("Checking if Ilan exists...");
  const { data: ilanExists } = await supabase.from('profiles').select('*').eq('username', 'team_ilan').maybeSingle();
  if (!ilanExists) {
    console.log("Creating Ilan...");
    const hash = bcrypt.hashSync('team123', 10);
    await supabase.from('profiles').insert([{
      name: 'Ilan',
      username: 'team_ilan',
      password: hash,
      role: 'team'
    }]);
  }

  console.log("Fetching phases...");
  const { data: phases } = await supabase.from('phases').select('*').order('order_index');
  if (!phases || phases.length < 4) {
    console.error("Phases not found, skipping todo mapping.");
    return;
  }

  const phaseMap = {
    1: phases[0].id,
    2: phases[1].id,
    3: phases[2].id,
    4: phases[3].id
  };

  const phase1Todos = [
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
    "Send portal login credentials to Swati via secure message"
  ];

  const phase2Todos = [
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
    "Collect Phase 2 payment (₹12,000) after demo sign-off"
  ];

  const phase3Todos = [
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
    "Collect Phase 3 payment (₹8,000) after sign-off"
  ];

  const phase4Todos = [
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
  ];

  console.log("Updating todos with phase IDs...");
  
  // Phase 1
  for (const text of phase1Todos) {
    await supabase.from('todos').update({ phase_id: phaseMap[1] }).eq('text', text);
  }
  // Phase 2
  for (const text of phase2Todos) {
    await supabase.from('todos').update({ phase_id: phaseMap[2] }).eq('text', text);
  }
  // Phase 3
  for (const text of phase3Todos) {
    await supabase.from('todos').update({ phase_id: phaseMap[3] }).eq('text', text);
  }
  // Phase 4
  for (const text of phase4Todos) {
    await supabase.from('todos').update({ phase_id: phaseMap[4] }).eq('text', text);
  }

  // Calculate and update progress for all phases
  console.log("Calculating dynamic progress...");
  for (const phase of phases) {
    const { data: todos } = await supabase.from('todos').select('*').eq('phase_id', phase.id);
    if (todos && todos.length > 0) {
      const completed = todos.filter(t => t.done).length;
      const progress = Math.round((completed / todos.length) * 100);
      await supabase.from('phases').update({ progress }).eq('id', phase.id);
    }
  }

  console.log("Done.");
}

seed();
