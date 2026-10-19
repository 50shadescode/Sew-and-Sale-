# AGENT.MD — Sew & Sell UNIFORMS Management Portal

## 1. Project Overview & Context
This repository contains the full-stack management web platform for **Sew & Sell UNIFORMS**, a tailoring, uniform manufacturing, and retail enterprise based in Kenya.

The platform digitizes client order intake, workshop floor cutting and assembly tracking, physical paper order receipt printing, customer WhatsApp messaging, inventory management, and financial revenue auditing.

- **Stack:** Next.js (App Router), TypeScript, Tailwind CSS, MongoDB (via Mongoose), hosted on Vercel.
- **Brand / Contact:** Sew and Sell Uniforms • Tel: 0700 049 052 • Currency: Kenyan Shillings (`KES`).

---

## 2. Architecture & File Structure

```text
src/
├── app/
│   ├── layout.tsx         # Global root layout (Header, Nav, Notification Bell, Floating Quick Action Dial)
│   ├── page.tsx           # Root redirect to /dashboard
│   ├── dashboard/
│   │   └── page.tsx       # Morning executive overview (KPI cards: revenue, pipeline, balances, inventory)
│   ├── orders/
│   │   ├── page.tsx       # 7-stage Production Pipeline Kanban board, live search, WhatsApp link, print modal
│   │   └── new/
│   │       └── page.tsx   # 5-Step Order Intake Wizard for front-desk staff
│   ├── workshop/
│   │   └── page.tsx       # Mobile-first workshop floor interface for tailors & fabric cut logs
│   ├── inventory/
│   │   └── page.tsx       # Fabric stock meters, minimum safety thresholds, and restock alerts
│   ├── finance/
│   │   └── page.tsx       # Financial ledger, outstanding account lists, and 1-click CSV download
│   └── api/
│       ├── orders/
│       │   ├── route.ts       # GET (fetch all orders), POST (create order)
│       │   └── [id]/route.ts  # PATCH (update order status/details), DELETE
│       └── inventory/
│           └── route.ts       # GET, POST, PATCH (stock adjustments)
├── lib/
│   └── db.ts              # MongoDB connection caching utility
└── models/
    ├── Order.ts           # Mongoose schema for Orders, Measurements, Tailor assignments & Payments
    └── Inventory.ts       # Mongoose schema for Fabrics & Supplies
3. Core Business Rules & Domain Logic

    Order Identifier:

        Orders use serial format ORD-XXXX (e.g., ORD-1001).

    7 Production Stages:

        Sequential progression: Intake ➔ Ready ➔ Cutting ➔ Assignment ➔ Sewing ➔ QC ➔ Dispatched.

    Financial Math:

        balanceRemaining = priceTotal - depositPaid.

        Never allow negative deposit inputs or balance math desync.

    Kenyan Phone Formatting:

        Input format may be 07XXXXXXXX or 01XXXXXXXX.

        Before triggering external WhatsApp API (https://wa.me/<number>), strip non-digits and normalize to Kenyan country code 254XXXXXXXXX.

    Print Receipt Fidelity:

        Receipts must match Leah's physical blue-bordered paper order book with red serial text, line item breakdown, total/paid/balance summary, and standard shop disclaimer: "Goods once sold are not returnable".

        Use CSS @media print rules to ensure UI navigation, buttons, and dark mode containers disappear upon printing.

4. Design System & UI Constraints

    Theme: Dark mode default using Tailwind slate-950 / slate-900 / slate-800 palette.

    Typography Hierarchy:

        Page Titles: text-3xl font-black

        Section Headings / Card Titles: text-xl font-bold

        Body / Subtext: text-base text-slate-300 / text-slate-400

        Badges / Metadata: text-xs font-mono font-bold

    Semantic Colors:

        Emerald (emerald-400, emerald-500): Cash collected, paid in full, completed states.

        Amber (amber-400, amber-500): Due dates, items in progress, warning states.

        Rose (rose-400, rose-500): Outstanding balances, unpaid debts, critical low stock.

        Blue (blue-500, blue-600): Primary actions, links, order identifiers.

    Mobile First for Workshop:

        Pages accessed on floor devices (/workshop) must maintain minimum touch targets of 44x44px for step counters (+, -) and assign buttons.

5. Development & Agent Conventions

    Next.js Version: App Router (src/app). Avoid Pages router conventions (pages/).

    Client Components: Any component utilizing React hooks (useState, useEffect, useRouter) or browser APIs (window.print(), window.open(), Blob) MUST declare 'use client'; at line 1.

    Database Safety: Always use cached Mongoose connections via src/lib/db.ts to prevent connection exhaustion during serverless cold starts.

    Environment Variables:

        MONGODB_URI: MongoDB Atlas connection string.

    No Hallucinated Packages: Do not install heavy external charting or UI libraries without explicit instruction. Rely on native Tailwind CSS and React primitives.
