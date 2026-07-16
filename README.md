# 🧵 Sew & Sale — Cloud-Native Workshop Kanban ERP & Garment Workshop Management System (GWMS)

A resilient, enterprise-grade resource planning (ERP) and production pipeline management system architected specifically for custom tailoring workshops and garment manufacturers. Sew & Sale consolidates raw material inventory, multi-stage garment assembly, point-of-sale operations, and deep reporting insights into a unified cloud-native platform.

---

## 🧭 Project Core Vision & Objectives

The primary target for **Sew & Sale** is to replace fragmented manual tracking, loose logs, and guess-based inventory operations with a single, reliable business management platform. The platform achieves this through four foundational architectural goals:

1.  **State-Preserving Production Pipelines:** Shifting workshop orders through an automated tracking state machine to eliminate project oversight or delays.
2.  **Generic Inventory Separation:** Decoupling fabric from hardcoded types to establish a fluid structural flow:
    
    $$\text{Raw Materials (Fabrics \& Accessories)} \longrightarrow \text{Active Production} \longrightarrow \text{Finished Products Catalog} \longrightarrow \text{Sales/POS Transactions}$$
    
    This mirrors actual textile workshop dynamics and avoids hardcoding dependencies.
3.  **Cross-Platform Dual-View Operability:** Providing a high-density Desktop Control Tower for comprehensive store administration alongside a clean, touch-friendly Mobile Workshop Floor layout for active tailors on the move.
4.  **Integrated Fiscal Accountability:** Enforcing secure customer billing rules (deposits vs. remaining balances) tied to automatic inventory adjustments and secure external payment verifications.

---

## 🏗️ System Architecture & Modular Layout

```text
                    ┌────────────────────────────────────────┐
                    │  Owner Dashboard / Control Tower (UI)  │
                    └───────────────────┬────────────────────┘
                                        │
                         Authentication & Authorization (JWT)
                                        │
                    ┌───────────────────┴────────────────────┐
                    │             REST API Layer             │
                    └───────────────────┬────────────────────┘
                                        │
 ┌──────────────────────┬───────────────┴──────┬──────────────────────┬──────────────────────┐
 │                      │                      │                      │                      │
Inventory Service   Production Service   Sales & POS Service    Customer Orders       Reporting Service
(Raw vs. Finished)  (Kanban State Machine) (Receipt Generator)   (Deposit Tracker)    (Analytics Dashboard)
 │                      │                      │                      │                      │
 └──────────────────────┴───────────────┬──────┴──────────────────────┴──────────────────────┘
                                        │
                           Mongoose ODM / MongoDB Cloud
1. Unified Authentication & AuthorizationSecure system access utilizing role-based access management vectors.  System Roles:Owner: Full visibility into analytics, profit reporting, inventory overhead, and core system settings.  Workshop Manager: Controls the production queue, checks raw materials, assigns cards to tailors, and updates stages.  Sales Attendant: Streamlined access focused entirely on the point-of-sale interface, searching items, and building receipts.  2. High-Density Executive DashboardReal-Time Work Metrics: Provides quick overviews including Today's Sales volume, Active Production queues, Current Stock levels, and immediate Low Stock alerts.  Actionable Activity Feeds: Displays chronological logs of recent transactions, immediate shortcuts for inventory creation, and rapid intake logging[cite: 1, 2].3. Generic Multi-Category Inventory ManagementRaw Materials Store: Tracks foundational items such as Fabrics (Name, Material composition, Color, and metric measurement units) alongside Hardware/Accessories (Buttons, Zippers, Thread rolls, and Brand packaging)[cite: 1, 2].Finished Goods Catalog: Tracks completed styles waiting for floor retail distribution or custom collection.  Automated Threshold Alerts: Triggers descriptive warning flags (Alert Level: Critical vs. Safe) when a stock ledger drops below its assigned baseline[cite: 1, 2].4. 7-Stage Kanban Production State MachineOrders step linearly through a state-preserving pipeline that dynamically monitors workshop throughput speeds:  Intake Register: Initial customer setup profiling, design specs, fabric selections, and date commitments.  Ready for Production: Backlog scheduling area waiting for material allocation to pass validations.  Cutting Area: Initial tailoring layout step where fabric yields are chopped and logged against metrics.  Assignment: Targeted task checking where work tickets are pinned to specific tailors.  Production Sewing: Active assembly floor stitch phase.  Control Tower QC: Quality Assurance gate to review construction metrics before final checkout clearances[cite: 2].Dispatched: Secure project archival state following payment settlement validations.  5. Sales & POS (Point of Sale Module)Provides instant barcode or text search queries against the active finished products catalog.  Deducts raw or finished assets atomically from the database upon completing a transaction, updating sales reports and dashboards simultaneously.  🗃️ Complete Schema Blueprint (Mongoose)Counter Schema (src/models/Counter.ts)TypeScript{
  _id: { type: String, required: true }, // e.g., 'orderIdSequence'
  seq: { type: Number, default: 1000 }
}
Order & Intake Schema (src/models/Order.ts)TypeScript{
  orderId: { type: String, unique: true }, // Standardized Sequence ID (e.g., ORD-1001)
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  garmentType: { type: String, enum: ['Suit', 'Dress', 'Shirt', 'Native'], required: true },
  fabricSelection: { type: String, required: true },
  priceTotal: { type: Number, required: true },
  depositPaid: { type: Number, default: 0 },
  balanceRemaining: { type: Number, required: true }, // (priceTotal - depositPaid)
  dueDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Intake', 'Ready', 'Cutting', 'Assignment', 'Sewing', 'QC', 'Dispatched'],
    default: 'Intake' 
  },
  assignedTailor: { type: String, default: null }
}
🛣️ Strategic Growth & Feature Implementation RoadmapPhase 1: Core Foundation & Connection Security (Current Build)Configured Node.js low-level DNS overrides (dns.setServers(['8.8.8.8', '1.1.1.1'])) to bypass local network and ISP route timeouts (querySrv ECONNREFUSED).Built base GET, POST, and PATCH API subfolders utilizing Mongoose ODM caching to prevent cloud connection exhaustion.Phase 2: Enhanced POS and Generic Inventory Models (V1 Completion)Build clean tab switches dividing Raw Materials from Finished Products inside the UI.  Integrate instant receipt drafting mechanisms that update data metrics right at point-of-sale completion.  Phase 3: Operational Accounting Extensions (V2 Framework)Incorporate employee attendance logs and direct operational expense metrics.  Build automated purchase order sequences linked directly to verified suppliers.  Phase 4: Automation & Multi-Outlet Integration (V3 Horizons)M-Pesa STK Push Gateway Hooks: Direct payment connections allowing real-time transaction updates to instantly clear outstanding customer balances[cite: 1].Automated WhatsApp Notifications: Instant webhook updates triggered when an order transitions into Control Tower QC or Dispatched queues[cite: 1].
