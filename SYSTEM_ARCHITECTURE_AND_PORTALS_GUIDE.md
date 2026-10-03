# INNOVISTA ENTERPRISE OPERATING SYSTEM — COMPLETE SYSTEM ARCHITECTURE, PORTALS, RBAC & WORKFLOWS REFERENCE

> **Document Version:** 2026.9 (Enterprise Master Specification)  
> **Scope:** Complete functional, architectural, Role-Based Access Control (RBAC), sub-portal, document registry, and end-to-end workflow reference covering every module, service, and micro-feature in the system.

---

## TABLE OF CONTENTS

1. [Executive System Overview & Core Architecture](#1-executive-system-overview--core-architecture)
2. [Global Navigation Bar & Master Portals Directory Hierarchy](#2-global-navigation-bar--master-portals-directory-hierarchy)
3. [Portal 1: Home Center & Executive Multi-Perspective Dashboard](#3-portal-1-home-center--executive-multi-perspective-dashboard)
4. [Portal 2: Factories Portal (Factory, Workshop & Site Execution Control)](#4-portal-2-factories-portal-factory-workshop--site-execution-control)
5. [Portal 3: Quotes, BOQ Engineering, Variant Matrix & Pricing Intelligence](#5-portal-3-quotes-boq-engineering-variant-matrix--pricing-intelligence)
6. [Portal 4: Projects, Variations, WBS Lifecycle, Gantt & Post-Evaluation](#6-portal-4-projects-variations-wbs-lifecycle-gantt--post-evaluation)
7. [Portal 5: Procurement & Supply Chain (ProcureFlow Nexus OS & 89 Documents)](#7-portal-5-procurement--supply-chain-procureflow-nexus-os--89-documents)
8. [Portal 6: Finance, 10-Pillar Corporate Accounting, Reporting & Payroll/WPS](#8-portal-6-finance-10-pillar-corporate-accounting-reporting--payrollwps)
9. [Portal 7: Operations (HR 18 Sub-Portals, Clients CRM, Workforce, Equipment, Safety/HSE, Quality/QA, Warranty)](#9-portal-7-operations-hr-18-sub-portals-clients-crm-workforce-equipment-safetyhse-qualityqa-warranty)
10. [Portal 8: System Governance, Security, RBAC, Collaborator Ecosystem & Trust](#10-portal-8-system-governance-security-rbac-collaborator-ecosystem--trust)
11. [Complete Role-Based Access Control (RBAC), Permissions & Segregation of Duties (SoD)](#11-complete-role-based-access-control-rbac-permissions--segregation-of-duties-sod)
12. [Cloud Collaboration Ecosystem (Account Categories, Types, Subtypes & 23 Information Categories)](#12-cloud-collaboration-ecosystem-account-categories-types-subtypes--23-information-categories)
13. [End-to-End System Workflows & Stage-Gate State Machines](#13-end-to-end-system-workflows--stage-gate-state-machines)
14. [Master Document Registries (89 Procurement Forms + 25 Factory Operational Documents + PDF Engines)](#14-master-document-registries-89-procurement-forms--25-factory-operational-documents--pdf-engines)
15. [Service Layer, Central API Gateway & Data Persistence Architecture](#15-service-layer-central-api-gateway--data-persistence-architecture)

---

## 1. EXECUTIVE SYSTEM OVERVIEW & CORE ARCHITECTURE

The **Innovista Enterprise Operating System** is a unified, full-lifecycle ERP, MES (Manufacturing Execution System), Construction Project Management, Procurement, Corporate Accounting, Human Capital, and Quality/Safety Control Platform purpose-built for architectural façade, aluminium, glass, structural steel, joinery, and turnkey contracting enterprises.

### Core Architectural Pillars
- **Single Source of Truth & Cross-Portal Traceability:** Every entity is relationally linked across portals:
  $$\text{Client} \rightarrow \text{Quote / BOQ} \rightarrow \text{Project Charter} \rightarrow \text{Factory Assignment (Work Package)} \rightarrow \text{Execution Plan \& Tasks} \rightarrow \text{Digital Worksheets \& Cutting Lists} \rightarrow \text{Material Issue (Inventory/GRN)} \rightarrow \text{QC Inspection (FIR/QIR/NCR)} \rightarrow \text{Dispatch \& Packing (DN/PKL)} \rightarrow \text{Site Installation \& WIR} \rightarrow \text{Client Acceptance \& Invoicing (AR/GL)} \rightarrow \text{Warranty Certificate}$$
- **Central API Gateway (`centralApiGateway.ts`):** Orchestrates cross-service events, real-time notifications, audit logging, and state synchronization across all domain services.
- **Multi-Layer Security & Governance:** Combines **21 System & Departmental RBAC Roles**, **480 Granular Permission Codes** (`24 Modules × 20 Actions`), **8 Data Access Scopes**, **4 Segregation of Duties (SoD) Rules**, **Temporary Access Grants**, **Permission Delegations**, and a **5-Category Cloud Collaboration Matrix** across **23 Information Categories**.

---

## 2. GLOBAL NAVIGATION BAR & MASTER PORTALS DIRECTORY HIERARCHY

The top navigation header (`z-[100]` with cascading dropdown menus at `z-[110]` / `z-[120+]`) provides instant access to **11 Top-Level Navigation Tabs** and the universal **Portals** mega-directory:

| # | Top Navbar Tab | Internal `view` State(s) | Direct Click Target | Sub-Menus / Dropdown Structure |
|---|---|---|---|---|
| 1 | **Home** (`Hub`) | `home` | Launch Home Center | Launch Home Center, Universal Portals Directory, Quick Action Hub |
| 2 | **Dashboard** | `dashboard` | Executive Overview | Overview, Executive, Finance, Operations, Quality, CRM, Analytics, Portals (Mega-Menu), Pricing |
| 3 | **Portals** (`All`) | *All Views* | Mega-Dropdown | Complete nested tree of Dashboard, Procurement, Factories, Quotes, Projects, Finance, Operations, System |
| 4 | **Factories** (`Live`) | `operational-control` | `Factories` Landing Card Grid | `Factories`, `Assignments`, `Tasks`, `Worksheets`, `Resources`, `Quality`, `Dispatch`, `Documents`, `Analytics`, `Partners`, `Hub` |
| 5 | **Quotes** | `history`, `editor`, `boq-items` | Dropdown | Register, Editor, Catalog (Library, Categories), Products (BOQ, Variants [Matrix, Analytics], Specs, Pricing), Templates, Create |
| 6 | **Invoices** | `invoices`, `accounting`, `reporting` | Dropdown | Register, Billing (Pending, Paid, Overdue), Recurring, Ledgers, Collections (Aging, Retention, BadDebt), Create |
| 7 | **Products** | `boq-items`, `showCatalog` | Dropdown | Catalog (Library, Categories), BOQ (Registry, Variants [Matrix, Analytics], Specs, Pricing), Templates, Import |
| 8 | **Projects** | `projects`, `project-details`, `variation-manager`, `project-lifecycle`, `post-evaluation` | Dropdown | Directory, Variations, Lifecycle (Dashboard, Phases, Gantt, Risks, Handover), Evaluation (Variance, Costs, PostMortem), Create |
| 9 | **Procurement** | `procurement`, `procurement-costs` | Procurement Landing Hub | Overview & Cockpit, Cost Items Hub & MOQ Rates, Sourcing & RFQ, Purchasing, Logistics, Governance |
| 10 | **Finance** | `accounting`, `reporting`, `payroll`, `invoices` | Dropdown | Accounting (Command Hub + 10 Accounting Pillars + Recurring), Reports (6 Financial Reports), Invoices, Payroll & WPS, Export |
| 11 | **Operations** | `operational-control` (HR), `clients`, `portal-view`, `resource-management`, `equipment-management`, `site-management`, `quality-control`, `after-sales` | Dropdown | Human Capital (HR - 12 Sub-Portals), Clients (Directory, Portal), Workforce (4 Tabs), Equipment (3 Tabs), Safety (7 Tabs), Quality (7 Tabs), Warranty (3 Tabs) |
| 12 | **System** | `verification`, `stealth-tunnel`, `settings`, `audit-log` | Dropdown | Trust (Verification, Registry, Codes), Tunnel (Stealth Tunnel), Security & RBAC, Audit, Import, Settings |

### Global Header Utilities (Row 1)
- **Global Search (`Ctrl+K`):** Instant search across quotes, projects, invoices, clients, and BOQ items.
- **Ongoing Projects Gantt Modal Trigger:** Opens interactive multi-project timeline & Gantt chart (`OngoingProjectsGantt.tsx`).
- **Download & Export Center Trigger:** Opens `DownloadPortal.tsx` for bulk PDF/CSV/Excel/JSON exports.
- **Notification Center (`NotificationCenter.tsx`):** Priority-filtered (`high`, `medium`, `low`), category-tagged (`Risk`, `Variation`, `BOQ`, `Rate`, `Follow-up`, `Status`, `System`, `Smart`, `General`, `Accounting`), pin-capable real-time notification drawer.
- **Active User & Role Switcher:** Displays current authenticated user, role badge, MFA status, and quick-switch or logout controls.

---

## 3. PORTAL 1: HOME CENTER & EXECUTIVE MULTI-PERSPECTIVE DASHBOARD

### 3.1 Home Center (`HomePage.tsx` — `view = 'home'`)
- **Universal Portals Launcher:** Visual directory cards for every major enterprise portal (Executive Dashboard, Factories, Quotes & Engineering, Project Management, Procurement & Supply Chain, Corporate Accounting & Finance, Human Capital & Payroll, Quality & HSE, Client & Partner Portals, Security & System Governance).
- **Quick Action Hub:** One-click creation of New Quotations, New Project Charters, Purchase Requisitions, Factory Work Packages, Tax Invoices, and QC Inspections.
- **Live Enterprise Pulse:** Real-time counters for Active Projects, Open Quotes, Factory Utilization, Pending Approvals, and Financial Cashflow.

### 3.2 Multi-Perspective Executive Dashboard (`Dashboard.tsx` — `view = 'dashboard'`)
Supports **7 specialized analytical perspectives** controlled via `dashboardPerspective`:
1. **`overview` (Overview Hub):** Consolidated KPIs across revenue, pipeline conversion, active projects, factory load, and recent audit activity.
2. **`executive` (Executive Cockpit):** Board-level P&L summary, backlog value, strategic project health matrix, and department budget burn rates.
3. **`finance` (Finance Perspective):** Cash flow velocity, Accounts Receivable vs. Accounts Payable, retention receivables, VAT liability, and collection aging.
4. **`operations` (Operations View):** Site deployment headcount, equipment utilization, factory output vs. target, and critical path milestone tracking.
5. **`quality` (Quality Perspective):** First-time pass rates (FTPR), open Non-Conformance Reports (NCRs), material quarantine value, and calibration compliance.
6. **`crm` (CRM & Pipeline):** Client tier distribution, quotation win/loss ratio, sales agent commission pipeline, and tender conversion funnel.
7. **`analytics` (Analytics, KPIs & Pricing Intelligence):** Margin distribution, BOM cost sensitivity, variant profitability, and predictive cost trends.

---

## 4. PORTAL 2: FACTORIES PORTAL (FACTORY, WORKSHOP & SITE EXECUTION CONTROL)

### 4.1 Design & Navigation Principles (`OperationalControlCenter.tsx`)
- **Minimalist White Header UI:** Clean one-line white background header (`Factories`) with live context selectors (Factory Filter, Project Filter, Search, Offline Queue Sync button, CSV Export, and HR switch) and a single-row bar of **11 One-Word Sub-Portals**.
- **Two-Word Button Discipline:** Every action button across the entire Factories portal and its sub-portals strictly uses 1–2 words (e.g., `Assign Project`, `Add Factory`, `Add Plan`, `New Task`, `Upload File`, `Start Work`, `Submit QC`, `Approve QC`, `Pack Items`, `Dispatch Site`, `Complete All`, `View Tasks`, `Open Hub`, `Print Form`, `Sync Queue`).
- **Project-Linked Context Bar:** Whenever a Factory and/or Assigned Project is selected, a sleek one-line context banner displays the active **Factory**, **Assigned Project**, **Client Name**, **Site Address**, **Stage Badge**, **Progress %**, and a `Clear Filter` button. All sub-portals automatically filter their records to the active Factory and Assigned Project.

### 4.2 The 11 Sub-Portals of the Factories Portal

#### Sub-Portal 1: `Factories` (`FactoryMasterRegistryTab.tsx` — Default Landing Page)
- **Factory Cards Grid:** Displays all internal and external factories (`Innovista Owned`, `External Supplier`, `Subcontractor`, `Strategic Partner`, `External Fabricator`) as clean cards showing:
  - Factory Code (`FAC-INV-01`, etc.), Name, Ownership Badge, Operational Status (`Active`, `High Load`, `Maintenance Window`, `Audit Hold`, `Suspended`), City/Country, Factory Manager, Monthly Capacity & Utilization %, and Performance Metrics (`Quality %`, `On-Time %`, `Safety %`).
  - **Assigned Projects Section inside each Factory Card:** Lists every project assigned to that factory with its **Project Name**, **Project Code**, **Work Package Code**, **Client Name**, **Site Address**, **Linked BOQ Items Count**, **Budgeted Value**, **Stage Status**, **Completion Progress Bar**, and quick two-word navigation buttons (`View Tasks`, `Open Hub`, `Worksheets`, `Quality`, `Dispatch`, `Documents`).
- **`Assign Project` Modal Workflow:**
  - Triggered directly from any Factory Card (`Assign Project` button) or header.
  - Selecting a Project from the system automatically links and previews all project metadata: **Client Name**, **Project Code**, **Category**, **Site Address**, **Contract Value**, and **All Linked BOQ Items** (with codes, quantities, units, and amounts).
  - Defines the **Work Package Title**, **Scope & Execution Instructions**, **Planned Quantity & Unit**, **Allocated Budget**, **Priority** (`Low`, `Normal`, `High`, `Urgent`, `Critical Path`), **Start & Deadline Dates**, **Responsible Manager**, and **Assigned Engineer**.
  - Defines the **Initial Execution Plan Phases** (Phase Name, Start Date, End Date, Owner, Status) and **Initial Execution Tasks** (Task Title, Operation Step, Quantity, Priority) in one unified assignment flow.
- **`Add Factory` Modal:** Registers new factories with full capability codes (18 fabrication capabilities), shift configurations, ISO certifications, trade licenses, and production bays.

#### Sub-Portal 2: `Assignments` (`WorkPackagesAndTasksTab.tsx` — `mode = 'work_packages'`)
- Lists all **Assigned Projects & Work Packages** (`FactoryWorkPackageAssignment`) across factories.
- Displays linked **Client**, **Site Address**, **Project Code**, **BOQ Item Badges**, **Planned vs. Completed / Dispatched / Installed Quantities**, **Budget vs. Actual Cost**, **16-Stage Gate Status**, and **Execution Plan Phase Pills**.
- Provides two-word actions: `Assign Project`, `Open Tasks`, `Submit QC`, `Approve QC`, `Dispatch`.

#### Sub-Portal 3: `Tasks` (`WorkPackagesAndTasksTab.tsx` — `mode = 'tasks_planning'`)
- **Execution Plan Manager:** Displays the assigned project's multi-phase execution plan (`Planned` → `Progressing` → `Quality Check` → `Completed`). Supervisors can click `Add Plan` to append new plan phases or click status pills to progress each phase in real time.
- **Task & Work Order Registry:** Lists all `Work Order`, `Job Card`, `Production Order`, `Fabrication Order`, `Cutting List Order`, `Rework Order`, and `Site Installation Order` records for the assigned project.
- **Universal Task Supporting Document Upload (`Upload File`):**
  - Every task supports uploading **any document type** (`PDF`, `CAD / DWG / DXF`, `Excel / CSV`, `Word / DOC`, `Images PNG/JPG`, `Video MP4`, `Archive ZIP`, or any custom file) via file picker or metadata entry.
  - Categorizes attachments by **Shop Drawing**, **Cutting List**, **Method Statement**, **Quality Checklist**, **Material Certificate**, **Photo Evidence**, **Calculation Sheet**, or **Other Document**, and allows instant preview/download.
- **Direct Supervisor Workflow Controls on Tasks:**
  - `Confirm Rev` (Worker confirms latest AFC drawing revision)
  - `Start Work` (Advances task to `In Progress`)
  - `Log Progress` (Opens modal to record completed, rejected, and rework units + actual hours)
  - `Submit QC` (Submits task for Quality Inspection)
  - `Approve QC` / `Rework` (QA approval or rework loop)
  - `Complete` → `Pack Items` → `Dispatch`

#### Sub-Portal 4: `Worksheets` (`WorksheetsDailyAndMediaTab.tsx` — `mode = 'worksheets_daily'`)
- **3 Clean Sub-Views (`Worksheets`, `Reports`, `Evidence`):**
  1. **Digital Worksheets (`DWS`):** Captures shop-floor fabrication logs across 9 activity types (Aluminium Windows/Doors, Unitized Curtain Wall, Structural Steel, AWS/ISO Welding, Glass Cutting & DGU, Powder Coating DFT, ACP Routing, Joinery, Site Erection) with nominal vs. actual tolerance measurements, shift labour hours, machine meter readings, and `Verify Sheet` / `Approve QC` actions.
  2. **Daily Factory Activity Reports (`DFAR`):** Shift supervisor daily logs tracking planned vs. completed units, active workers, man-hours, machine hours, delay categories, toolbox talk topics, and PM approval (`Approve Log`).
  3. **Photographic & Video Evidence (`EVD`):** Geo-tagged visual evidence across 6 stages (`Before Execution`, `During Fabrication`, `QC Inspection`, `Packing & Loading`, `Site Delivery`, `After Completion`) with QA verification (`Verify Media`).

#### Sub-Portal 5: `Resources` (`ResourcesAndMaterialsTab.tsx`)
- **4 Integrated Resource Views (`Materials`, `Machines`, `Workforce`, `Bays`):**
  1. **Material Issue & Consumption:** Tracks task-level raw material requirements linked to central warehouse inventory (`Required`, `Issued`, `Consumed`, `Wastage`, `Scrap`, `Batch/Heat Lot No`) with instant `Issue Stock` action.
  2. **CNC & Plant Machinery:** Live status of assigned factory machines (`Operational`, `Maintenance`, `Idle`), health scores, calibration dates, and utilization bars.
  3. **Shop-Floor Workforce:** Roster of assigned fabricators, welders, CNC operators, and QA inspectors linked to HR & Attendance.
  4. **Production Bays:** Utilization tracking across Cutting, Machining, Welding, Assembly, Glazing, Coating, QC, and Packing bays.

#### Sub-Portal 6: `Quality` (`QualityHseAndDispatchTab.tsx` — `mode = 'quality_hse'`)
- **Factory Quality Inspections (`FIR` / `QIR`):** Covers Incoming Material Inspection (`MIR`), First Article Inspection (`FAI`), Dimensional Check, Welding & NDT, Surface Coating DFT, Factory Acceptance Test (`FAT`), Pre-Dispatch Packing Verification, and Site Installation Inspection (`WIR`).
- Includes 5-Why Root Cause Analysis, CAPA plans, automatic central NCR generation (`Rejected - NCR Raised`), and two-word actions (`New Check`, `Approve QC`, `Rework`, `Reject NCR`).

#### Sub-Portal 7: `Dispatch` (`QualityHseAndDispatchTab.tsx` — `mode = 'dispatch_site'`)
- **Dispatch, Crate Packing & Site Installation Tracker (`DSP` / `DN` / `PKL`):**
  - Tracks crates/pallets, gross weight (kg), QR batch codes, vehicle registration, driver details, and site installation zones/elevations.
  - Progresses dispatches through 8 lifecycle stages (`Packed at Factory` → `Loaded & Dispatched` → `In Transit to Site` → `Delivered & Received at Site` → `Site Installation In Progress` → `Installed - Pending WIR Inspection` → `Inspect & Approved on Site` → `Client Accepted & Handed Over`) via `Receive Site`, `Install Step`, and `Accept Handover` actions.

#### Sub-Portal 8: `Documents` (`DocumentsPerformanceAndPartnerTab.tsx` — `mode = 'documents_drawings'`)
- **Controlled Drawings & AFC Revisions (`Drawings` tab):** Manages Shop Drawings, Fabrication Drawings, Cutting Lists, BOQs, Technical Specs, Method Statements (`MOS`), ITPs, and Structural Calculations with worker revision read-confirmations (`Confirm Read`).
- **25 Official Factory Document Generator (`Generated` tab):** Generates, previews, and prints 25 controlled operational document types (`Generate Doc`, `Print Form`).

#### Sub-Portal 9: `Analytics` (`DocumentsPerformanceAndPartnerTab.tsx` — `mode = 'analytics_audit'`)
- **Scorecards (`Scorecards` tab):** Multi-factory KPI comparison across Overall Score, Quality Acceptance %, On-Time Completion %, Safety Compliance %, Labour Productivity, Machine Utilization, and Wastage %.
- **Approval Matrix (`Matrix` tab):** Configurable SLA and mandatory QC hold-point rules by project scope, factory ownership type, and value threshold.
- **Audit Trail (`Audit` tab):** Immutable revision and decision history across all work packages and tasks.

#### Sub-Portal 10: `Partners` (`DocumentsPerformanceAndPartnerTab.tsx` — `mode = 'partner_portal'`)
- Dedicated External Fabricator, Subcontractor & Strategic Partner portal where external factories accept assigned work packages (`Accept Order`), submit progress, and upload compliance documentation.

#### Sub-Portal 11: `Hub` (`OperationalControlCenter.tsx` — `activePortal = 'dashboard'`)
- **Factory Supervisor Workflow Control Center:**
  - Interactive **6-Stage Supervisor Pipeline** for every assigned project:
    1. `Planned` (`Start Work`)
    2. `Progressing` (`Submit QC`)
    3. `Quality Check` (`Approve QC` / `Rework`)
    4. `Approved` (`Pack Items`)
    5. `Dispatched` (`Deliver Site`)
    6. `Handed Over` (`Complete All`)
  - Displays live **Execution Plan Phases** and **Active Tasks** with instant supervisor stage progression buttons and quick links to all other sub-portals.

---

## 5. PORTAL 3: QUOTES, BOQ ENGINEERING, VARIANT MATRIX & PRICING INTELLIGENCE

### 5.1 Quotation Register (`ProjectHistory.tsx` — `view = 'history'`)
- Manages all quotations across the **8-Stage Quotation Lifecycle (`QuoteStatus`)**:
  `Draft` → `Site Visit` → `Internal Review` → `Sent` → `Revision` → `Won` → `Lost` → `Project`
- Supports multi-criteria filtering, revision cloning, win/loss conversion, PDF generation, and one-click **Convert to Active Project**.

### 5.2 Quotation & BOQ Live Editor (`App.tsx`, `BOQTable.tsx`, `LivePreview.tsx` — `view = 'editor'`)
- **Hierarchical BOQ Table (`BOQTable.tsx`):**
  - Supports `Title`, `Main`, and `Sub` line items with automatic numbering (`1`, `1.1`, `1.2`), PVC codes, Product Codes, Quantities, Units (`m`, `ft`, `in`, `mm`, `m2`, `sqft`, `m3`, `kg`, `Tons`, `Nos`, `Set`, `Lot`, `Hour`, `Day`, `Visit`), Rates, Discounts, Item-level Additional Charges, and Margin snapshots.
- **Geometric Measurement Sheet Portal (`MeasurementPortal.tsx`):**
  - Calculates quantities using 7 methods (`Area`, `Volume`, `Linear`, `Perimeter`, `Surface`, `Weight`, `Unit`) and 7 geometric shapes (`Rectangle`, `Triangle`, `Circle`, `Trapezoid`, `Ellipse`, `Sector`, `Solid`) with deduction rows (e.g., window/door cutouts).
- **Technical Specification Portal (`SpecificationPortal.tsx`):**
  - Defines core system types, dimensions, Aluminium specs (alloy grade, thickness, series, finish: Natural, Powder Coated, Bronzed, Wood Finished), Steel specs, Glass specs (tempered, laminated, DGU, tint, acoustic/thermal U-value), Hardware/Accessories, wind load, water penetration, and fabrication/installation standards.
- **Terms & Conditions Editor (`TermsEditor.tsx`) & Timeline Editor (`TimelineEditor.tsx`):**
  - Manages contractual clauses, payment tiers (`PaymentTier`), and week-by-week execution bars.
- **Real-Time Multi-Layout PDF Preview (`LivePreview.tsx` & `pdfGenerator.ts`):**
  - Supports multiple professional PDF layouts (`Executive`, `Grid`, `Minimal`, `Technical`, `Detailed`) with customizable accent colors, font sizes, bank details, QR verification codes, and digital watermarks.

### 5.3 Master Item Catalog (`ItemCatalog.tsx` — Modal `showCatalog`)
- **Master Library (`OVERVIEW`) & Categories Tree (`CATEGORIES`):** Multi-level category hierarchy with color tags, product families, and reusable specification/calculation libraries.

### 5.4 BOQ Item Manager & Variant Engine (`BOQItemManager.tsx` — `view = 'boq-items'`)
Contains **4 Engineering Tabs**:
1. **`CATEGORIES_ITEMS` (BOQ Item Registry):** Master library of products and services with standard rates, costs, and technical specs.
2. **`VARIANTS_LIST` (Variant Matrix — `VariantListView.tsx` & `VariantCreationWizard.tsx`):**
   - Generates multi-dimensional product variants from `ProductFamily` feature groups (e.g., Series × Glass Thickness × Surface Finish × Hardware Brand).
   - Links directly to BOM Cost Items (`bomPricingService.ts` & `variantEngineService.ts`) with automatic cost roll-up, price lock rules, and historical rate versions (`RateVersion`).
3. **`SPEC_ENGINE` (Smart Spec Engine):** Rule-based specification generator and library manager.
4. **`PRICING_INTELLIGENCE` (`PricingIntelligenceDashboard.tsx`):** Analyzes material cost fluctuations, supplier MOQ tier impacts, and target vs. actual gross margins across all BOQ variants.

### 5.5 Quote Template Manager (`QuoteTemplateManager.tsx` & `SaveTemplateModal.tsx`)
- Pre-configured industry templates (`constructionTemplates.ts`) for Curtain Walls, Aluminium Windows & Doors, Structural Steel Warehouses, Frameless Glass Partitions, Skylights, and Villa Packages.

---

## 6. PORTAL 4: PROJECTS, VARIATIONS, WBS LIFECYCLE, GANTT & POST-EVALUATION

### 6.1 Project Directory & Details (`ProjectManager.tsx` — `view = 'projects'` | `'project-details'`)
- Manages active construction and fabrication projects created from won quotes or direct project charters.
- Tracks **Contract Value**, **Original Sum**, **Variation Sum**, **Payment Milestones (`PaymentTier`)**, **Retention %**, **Linked Quotations**, **Project Reports**, and **Project-Specific Audit Logs**.
- Integrates directly with the **Factories Portal** (to assign work packages) and **Invoice Builder** (to bill achieved milestones).

### 6.2 Variation Order Manager (`VariationManagerPortal.tsx` & `ProjectVariationEditor.tsx` — `view = 'variation-manager'`)
- Full Variation Order (`VO`) lifecycle:
  - Tracks `Original`, `Additional`, and `Omitted` BOQ items.
  - Calculates net financial impact, schedule extension days, and revised contract sum.
  - Generates official **Variation Order PDF** documents with side-by-side comparison of Original vs. Revised quantities and rates.

### 6.3 Project Lifecycle & WBS Portal (`ProjectLifecyclePortal.tsx` — `view = 'project-lifecycle'`)
Contains **4 Sub-Portals (`lifecycleTab`)**:
1. **`dashboard`:** Project health scorecard, milestone progress, earned value indicators, and integrated Gantt view.
2. **`phases` (Phases & WBS):** Work Breakdown Structure across Design, Engineering Approval, Material Procurement, Factory Fabrication, Site Delivery, Installation, Testing & Commissioning, and Handover.
3. **`risks` (Risk Register):** Probability × Impact risk matrix, mitigation owners, and contingency tracking.
4. **`handover` (Handover Protocol):** Snagging checklist, As-Built drawing submission, O&M manuals, TOC (Taking Over Certificate), and automatic Warranty Certificate issuance.

### 6.4 Project Post-Evaluation & Variance Portal (`ProjectPostEvaluationPortal.tsx` — `view = 'post-evaluation'`)
- Compares **Estimated BOQ Budget** vs. **Actual Material, Labour, Equipment, and Subcontract Costs** (`costEvaluationService.ts`).
- Captures historical post-mortem lessons learned and margin variance root causes.

---

## 7. PORTAL 5: PROCUREMENT & SUPPLY CHAIN (PROCUREFLOW NEXUS OS & 89 DOCUMENTS)

### 7.1 Procurement Portal Architecture (`ProcurementPortal.tsx` — `view = 'procurement'`)
Organized into a **Landing Hub** plus **15 Specialized Sub-Portals**:
1. **`landing` (Procurement Command Hub):** Quick navigation cards to all supply chain modules and live procurement alerts.
2. **`overview` (Overview & Cockpit):** Real-time spend KPIs, open PRs/RFQs/POs, delivery lead times, and savings realized YTD.
3. **`costing` (`ProcurementCostPortal.tsx` — `view = 'procurement-costs'`):**
   - **Cost Items Hub & MOQ Rates:** Manages raw materials, outside services, subcontractor labour, equipment/plant, and logistics contracts (`procurementCostService.ts`).
   - Supports multi-supplier rate cards, Minimum Order Quantity (MOQ) tiered price ranges (`SupplierPriceRange`), item variants (`ProcurementItemVariant`), and live **BOM Dependency Links (`CostItemDependencyLink`)** that propagate raw material price changes directly to BOQ Product Variants.
4. **`documents` (`ProcurementMasterDocsTab.tsx`):**
   - **All 89 Official Procurement Documents Registry** categorized into 4 groups:
     - **Setup & Master Docs (Docs 1–22)**
     - **Project Procurement Docs (Docs 23–40)**
     - **Material & Requirements Docs (Docs 41–60)**
     - **Technical Procurement Docs (Docs 61–89)**
   - Every document opens in the **Universal Document Editor & A4 Print Engine (`UniversalProcurementDocModal.tsx`)** with barcode generation, editable 5-column dynamic tables, standard legal/CWCT/ISO clauses, and 4-tier corporate signature blocks.
5. **`pr` (Purchase Requisitions & Approvals Queue):**
   - Budget-checked requisitions (`PurchaseRequisition`) with automatic **Budget Exceeded** flagging and one-click conversion to RFQ or PO.
6. **`rfq` (RFQs & Bid Comparison Matrix):**
   - Multi-supplier invitation, bid tabulation, technical compliance verification, and automated award justification.
7. **`auctions` (Live Reverse Dutch Auctions):**
   - Real-time competitive supplier bidding (`ReverseAuction`) with minimum decrement enforcement, auto-extension timers, and instant PO award.
8. **`emergency` (Safety Fast-Track & Retroactive Audits):**
   - Express PO issuance for critical site safety/breakdown emergencies (`EmergencyRequest`) with mandatory post-issuance audit sign-off.
9. **`pos` (Purchase Orders & Dual Authorization):**
   - Full PO lifecycle (`Draft` → `Pending Approval` → `Approved` → `Issued` → `Partially Received` → `Completed`) across branches (`Main Store`, `Dubai Fabrication Yard`, `Abu Dhabi Site Hub`).
10. **`contracts` (Framework Contracts & Price Lock Terms):**
    - Master agreements (`ContractAgreement`) with locked rate cards, SLA penalty clauses, OTIF targets, and remaining value burn-down.
11. **`suppliers` (Suppliers Directory, Compliance & Scorecards):**
    - Vendor master (`Supplier`), COI/Trade License/TRN/ISO 9001 compliance expiry tracking (`SupplierComplianceDoc`), weighted quarterly performance evaluations (`A+` to `D`), and supplier support tickets (`SupplierTicket`).
12. **`grn` (Goods Receipt Notes & Barcode Scanning):**
    - Physical inbound receiving (`GoodsReceiptNote`), bin location assignment, heat/mill certificate recording, and QC inspection status (`QC Passed`, `QC Conditional Pass`, `QC Rejected`).
13. **`scn` (Subcontract Service Completion Notes):**
    - Milestone-weighted service measurement (`ServiceCompletionNote`) with Supervisor, Site Manager, and QA triple sign-off.
14. **`inventory` (Warehouse Stock & Reorder Alerts):**
    - Multi-warehouse stock ledger (`InventoryStockItem`), reserved vs. available quantities, reorder threshold alerts, and stock movements (`StockMovement`).
15. **`scrap` (Scrap & Material Reclaim Intercept):**
    - 7-day internal project reclamation window (`ScrapRecord`) allowing other projects to claim offcuts/surplus before public scrap auction or liquidation.
16. **`invoices` (3-Way Match Invoices & PVC Authorization):**
    - Automated **3-Way Matching** (`PO` vs. `GRN/SCN` vs. `SupplierInvoice`), fraud risk scoring, discrepancy detection, and cryptographic **Payment Verification Code (`PVC` — HMAC-SHA256 token)** generation.
17. **`ncrs` (Procurement Quality NCR Holds & Debit Intercept):**
    - Material non-conformance holds (`ProcurementNCR`) that automatically freeze supplier invoice payments (`holdPaymentApplied`) until CAPA closure.
18. **`analytics` (Spend Intelligence & HHI Concentration):**
    - Category spend breakdown and Herfindahl-Hirschman Index (HHI) supplier concentration risk analysis.

---

## 8. PORTAL 6: FINANCE, 10-PILLAR CORPORATE ACCOUNTING, REPORTING & PAYROLL/WPS

### 8.1 Invoice Register & Builder (`InvoiceManager.tsx`, `InvoiceBuilder.tsx`, `InvoiceDetailView.tsx`, `InvoicePreview.tsx` — `view = 'invoices'`)
- Manages Tax Invoices, Proforma Invoices, Progress Valuation Invoices, and Retention Invoices linked to projects and clients.
- Tracks partial payments, credit notes, overdue reminders, and live PDF preview/export.

### 8.2 10-Pillar Corporate Accounting Control Portal (`AccountingPortal.tsx` — `view = 'accounting'`)
Powered by `accountingControlService.ts`, featuring a **Command Hub (`landing`)** plus **11 Specialized Sub-Portals**:
1. **`overview` (1. Control Dashboard):** Real-time Trial Balance check ($\sum \text{Debits} = \sum \text{Credits}$), working capital ratio, net profit margin, cash runway, and exception alerts.
2. **`gl` (2. General Ledger & Chart of Accounts):** Hierarchical Chart of Accounts (`1000 Assets`, `2000 Liabilities`, `3000 Equity`, `4000 Revenue`, `5000 Cost of Goods Sold`, `6000 Operating Expenses`) and double-entry Journal Voucher (`JV`) posting with reversal locks.
3. **`payments` (3. Accounts Receivable — AR):** Customer receipt vouchers, unapplied cash allocation, advance payment tracking, andPDC (Post-Dated Cheque) maturity tracking.
4. **`ap` (4. Accounts Payable & 3-Way Match — AP):** Supplier bill booking, 3-Way Match verification (`PO + GRN + Bill`), PVC token validation, and payment batch scheduling.
5. **`bank` (5. Bank, Treasury & Petty Cash):** Multi-currency bank accounts, automated bank statement reconciliation, inter-account transfers, and site petty cash imprest vouchers.
6. **`project_accounting` (6. Project Costing, WIP & Earned Value):** Project-level P&L, Work-in-Progress (WIP) revenue recognition, committed vs. actual cost breakdown, and margin slippage alerts.
7. **`adjustments` (7. Credit/Debit Notes & Retentions):** Customer Credit Notes, Supplier Debit Notes, and Defects Liability Period (DLP) Retention Receivable/Payable release schedules.
8. **`ledgers` (8. T-Account General & Sub-Ledgers):** Interactive T-Account drill-down for every GL account, Debtor (Client) ledger, and Creditor (Supplier) ledger.
9. **`assets_tax_close` (9. Fixed Assets, VAT/Tax & Period Close):** Fixed asset depreciation schedules (Straight-Line / Reducing Balance), FTA/IRD VAT Return computation (`Output VAT - Input VAT`), and hard fiscal period-end closing locks.
10. **`reports` (10. Statutory Financial Statements):** Real-time **Statement of Profit or Loss (P&L)**, **Statement of Financial Position (Balance Sheet)**, **Statement of Cash Flows**, and **Trial Balance**.
11. **`recurring` (Recurring Billing Engine):** Automated periodic invoicing for maintenance contracts, leased equipment, and retainer agreements.

### 8.3 Financial Reporting Portal (`ReportingPortal.tsx` — `view = 'reporting'`)
Provides **6 Executive Financial & Credit Reports (`reportingReport`)**:
- **`Statement`:** Client Statement of Account (SOA) with running balance.
- **`Aging`:** 30 / 60 / 90 / 120+ Days Accounts Receivable Aging Analysis.
- **`Collection`:** Collections Efficiency & DSO (Days Sales Outstanding) Center.
- **`Retention`:** Project Retention Release & DLP Expiry Tracker.
- **`Project`:** Cross-Project Financial Profitability & Billing Summary.
- **`BadDebt`:** Provision for Doubtful Debts & Bad Debt Reserve Calculator.

### 8.4 Payroll, WPS & Statutory Compliance Center (`PayrollPortal.tsx` — `view = 'payroll'`)
Powered by `payrollService.ts`, managing:
- **Monthly Payroll Cycles & WPS SIF Generation:** Full payroll calculation (`Basic + Housing + Transport + Overtime + Bonuses - Deductions = Net Payable`) and Wage Protection System (`WPS`) bank batch generation.
- **Project-Based Payroll Plans (`ProjectPayrollPlan`):** Compares planned man-days and labor budgets (e.g., Baseline Shift vs. Fast-Track Overtime) against actual timesheet hours.
- **Department Headcount Budgets (`DepartmentPayrollPlan`):** Tracks annual department payroll budgets and YTD burn rates.
- **Statutory & Accounting Reconciliation (`StatutoryReconciliationRecord`):** Reconciles **8% Employee EPF**, **12% Employer EPF**, **3% Employer ETF** (23% total statutory remittance), and **APIT Income Tax** directly with Accounting Bank Payout references.
- **Quick Payouts & Site Advances (`QuickPayoutRecord`):** Manages Salary Advances, Site Per Diems, Overtime Instant Cash, Emergency Loans, and Tool/Travel Reimbursements.

---

## 9. PORTAL 7: OPERATIONS (HR 18 SUB-PORTALS, CLIENTS CRM, WORKFORCE, EQUIPMENT, SAFETY/HSE, QUALITY/QA, WARRANTY)

### 9.1 Human Capital Management System (`HumanResourcesPortal.tsx` — `view = 'operational-control'`, `portalId = 'hr'`)
Powered by `hrService.ts` (`src/types/hr.ts`), covering the complete employee lifecycle across **18 Sub-Portals (`HRPortalView`)**:
1. **`landing`:** HR Command Hub & quick navigation across all 36 HR domain areas.
2. **`executive`:** Workforce snapshot, headcount vs. budget, turnover rate, and executive HR KPIs.
3. **`admin` (Employee Master & Organization):** Multi-company, branch, department, cost center, job grade (`G1–G8`), position management, and 360° Employee Master profiles (`HREmployeeMaster`).
4. **`recruitment` (ATS & Onboarding):** Vacancy requisitions (`HRVacancy`), 10-stage applicant pipeline (`Applied` → `Hired`), interview scorecards, and role-assigned onboarding checklists (`HROnboardingTask`).
5. **`ess` (Employee Self-Service):** Personal profile, leave requests, payslips, salary certificate requests, asset acknowledgements, and training nominations.
6. **`mss` (Manager Self-Service):** Team attendance monitor, leave/overtime approvals, performance appraisals, and skill gap matrix.
7. **`attendance` (Shifts, Rosters & Timesheets):** Shift definitions, station rosters, daily clock-in/out logs, and project labor timesheets (`HRProjectTimesheet`).
8. **`biometrics` (Biometric & Laser Terminal Hardware Integration):**
   - Manages live hardware terminals (`ZKTeco`, `Hikvision`, `Anviz`, `Suprema`, `Honeywell_Laser`, `Zebra_Scanner`) across `FINGERPRINT`, `FACIAL_RECOGNITION`, `LASER_BARCODE`, `RFID_TAG`, and `PALM_VEIN` verification (`BiometricPunchLog`).
   - Enforces stateful arrival/departure logic (`NOT_ARRIVED` ↔ `ARRIVED` ↔ `ON_LEAVE_OUT`), automatic late minute calculation against shift start, and real-time overtime completion tracking.
9. **`meals` (Meal & Tea Laser Scanning & Benefit Fund):**
   - Tracks daily canteen/refreshment scans (`MealScanRecord`).
   - Supports company-funded meal allocations where unclaimed meal balances automatically roll over into employee paysheet benefits, or salary-deducted meal tracking.
10. **`loans` (Employee Loans & Amortization Engine):**
    - Configures staff loans and advances (`EmployeeLoanSetup`) with principal, custom interest rate %, repayment months, and automatic monthly principal + interest deduction in payroll.
11. **`compensation` (Comprehensive Compensation, Bonuses & Gratuity Setup):**
    - Per-employee EPF/ETF rate overrides, EPF-eligible vs. non-EPF allowances, special bonuses (Performance, Attendance, Festival/Avurudu, Project Milestone, Safety Zero-LTI), piece-rate/contract payouts, sales commissions, and Sri Lankan Gratuity Act calculation (`0.5 × Basic Salary × Years of Service`).
12. **`payroll` (Integrated HR Paysheet Engine):**
    - Real-time calculated paysheets (`CalculatedEmployeePaysheet`) combining basic salary, allowances, biometric OT pay, unclaimed meal benefits, bonuses, contracts, commissions, gratuity, 8% Employee EPF, loan installments, late deductions, APIT tax, 12% Employer EPF, and 3% Employer ETF.
13. **`performance` (Performance Cycles & OKRs):** Goal weighting, self-reviews, manager appraisals (`HRPerformanceAppraisal`), calibration grades, and promotion recommendations.
14. **`learning` (Skills Matrix & LMS):** Technical skill registry (`HRSkillMaster`), training courses (`HRCourse`), enrollments, assessment scores, and certification expiry alerts.
15. **`relations` (Employee Relations, Disciplinary & Exit Management):** Confidential grievance/disciplinary cases (`HRCase`), multi-department exit clearance checklists (`ExitClearanceChecklistItem`), exit interviews, and final end-of-service settlement calculation.
16. **`documents` (HR Compliance Vault):** Visa, Passport, Emirates/National ID, Trade Certificate, and Medical Fitness expiry tracking (`HRDocument`).
17. **`planning` (Workforce & Project Manpower Planning):** Quarterly headcount plans (`HRHeadcountPlan`), succession planning (`HRSuccessionPlan`), and project trade manpower allocation (`HRProjectManpowerRequirement`).
18. **`analytics` (HR Analytics & KPI Engine):** Formula-driven HR KPIs (`HRKPIDefinition`) across retention, absenteeism, recruitment time-to-fill, and labor cost per project.

### 9.2 Clients CRM & Dedicated Client Portal (`ClientManager.tsx`, `CustomerPortal.tsx`, `ClientLandingPage.tsx`)
- **Client Directory (`view = 'clients'`):** Full CRM with `Individual` and `Company` accounts, CVC codes, credit limits, payment terms, multiple contact persons (`canApproveQuotes`, `canReceiveInvoices`), multi-site addresses, and internal sales agent/contractor commission tracking (`isCommHidden`).
- **Dedicated Client Portal (`view = 'portal-view'` | `'customer-portal'`):** External-facing client workspace displaying the client's active quotations, live project progress, milestone invoices, variation approvals, and warranty certificates.

### 9.3 Workforce & Field Resource Portal (`ResourceManagementPortal.tsx` — `view = 'resource-management'`)
Contains **5 Tabs (`resourceTab`)**:
- **`landing` (Workforce Command Hub)**
- **`personnel` (Personnel Roster):** Trade technicians, fabricators, glazers, and site installers with hourly billing/cost rates.
- **`timesheets` (Timesheet Verification):** Daily project hours verification and overtime sign-off.
- **`deployment` (Site Deployment Matrix):** Live assignment of crews across construction sites and factory bays.
- **`certifications` (Certifications & Badges):** Working at Height, Scaffold, AWS Welder, and Crane Operator license tracking.

### 9.4 Equipment & Plant Machinery Portal (`EquipmentManagementPortal.tsx` — `view = 'equipment-management'`)
Powered by `equipmentControlService.ts`, containing **4 Tabs (`equipmentTab`)**:
- **`landing` (Equipment Command Hub)**
- **`inventory` (Equipment Inventory):** CNC 5-Axis Machining Centers, Double-Mitre Saws, Glass Tempering Furnaces, Tower Cranes, Scissor Lifts, and Fleet Vehicles.
- **`maintenance` (Preventive Maintenance):** Scheduled servicing, breakdown repair logs, spare parts cost, and MTBF/MTTR metrics.
- **`inspections` (Equipment Inspections):** Daily pre-start operator safety checks and third-party lifting gear certifications.

### 9.5 Site Safety & HSE Control Portal (`SiteManagementPortal.tsx` — `view = 'site-management'`)
Powered by `safetyControlService.ts`, containing **7 Tabs (`siteTab`)**:
1. **`landing` (Safety Command Hub):** LTI-free man-hours, active high-risk permits, and HSE compliance index.
2. **`permits` (Work Permits — PTW):** Hot Work, Working at Height, Confined Space, Heavy Lifting, and Electrical LOTO (Lockout/Tagout) permits with gas testing and validity timers.
3. **`risks` (Risk & JSA Control):** Job Safety Analysis (JSA) and Method Statement hazard controls.
4. **`inspections` (Tags & PPE Stock):** Scaffold green/red tagging, harness inspections, and PPE issuance stock.
5. **`hse` (Toolbox Talks & Site Induction):** Daily briefing attendance logs and visitor/worker safety inductions.
6. **`incidents` (Incidents, Near-Miss & CAPA):** Incident investigation, root cause analysis, and corrective actions.
7. **`contacts` (Emergency Response & Drills):** Emergency evacuation drill logs, muster points, and medical/civil defense contacts.

### 9.6 Quality Assurance & ITP Control Portal (`QualityControlPortal.tsx` — `view = 'quality-control'`)
Powered by `qualityControlService.ts`, containing **7 Tabs (`qcTab`)**:
1. **`landing` (Quality Command Hub):** Quality pass rate, open NCRs, lab test pipeline, and CoPQ (Cost of Poor Quality).
2. **`inspections` (QC Inspections — ITP):** Inspection & Test Plan (`Witness`, `Hold`, `Review` points) across fabrication and site installation.
3. **`iqc` (Incoming QC — IQC & MTC):** Mill Test Certificate (`MTC`) verification, alloy spectrometer checks, and powder coating micron verification.
4. **`testing` (Lab & Water Hose Tests):** CWCT / AAMA site water penetration hose tests, structural pull-out tests, and acoustic/wind load lab reports.
5. **`ncrs` (NCR & Quarantine Control):** Non-Conformance Reports, physical quarantine cage tracking, disposition decisions (`Rework`, `Scrap`, `Use As-Is with Concession`), and CAPA verification.
6. **`calibration` (Gauge & Instrument Calibration):** Vernier calipers, DFT Elcometers, torque wrenches, and laser levels ISO 17025 calibration certificates.
7. **`standards` (Quality Standards & Handover Dossiers):** Reference library of ISO 9001, AWS D1.1, BS EN, and ASTM standards plus final QA handover dossier compilation.

### 9.7 After-Sales & Warranty Portal (`WarrantyPortal.tsx` — `view = 'after-sales'`)
Contains **4 Tabs (`warrantyTab`)**:
- **`landing` (Warranty Command Hub)**
- **`certificates` (Warranty Certificates):** Generates official 10-Year / 15-Year Product, Surface Finish, Glazing, and Workmanship Warranty Certificates with QR verification.
- **`requests` (Service & Defect Claims):** SLA-tracked client maintenance/rectification tickets under DLP or warranty.
- **`history` (Service History Log):** Complete ledger of site visits, seal replacements, and hardware adjustments.

---

## 10. PORTAL 8: SYSTEM GOVERNANCE, SECURITY, RBAC, COLLABORATION & TRUST

### 10.1 Document Verification & Anti-Tamper Portal (`DocumentVerificationPortal.tsx` — `view = 'verification'`)
- Validates cryptographic document hashes, Payment Verification Codes (`PVC`), Quotation/Invoice QR codes, and Warranty Certificate authenticity against the immutable document registry.

### 10.2 Stealth Communication Tunnel (`StealthCommunicationTunnel.tsx` — `view = 'stealth-tunnel'`)
- End-to-end encrypted executive and site communication channel for sensitive tender pricing, commercial negotiations, and confidential engineering dispatches.

### 10.3 System Audit Trail (`AuditLog` view — `view = 'audit-log'`)
- Immutable chronological ledger of all commercial, operational, project, variation, accounting, and security events with user, timestamp, IP, device, and before/after state.

### 10.4 Universal Data Import Center (`DataImportModal` — `dataImportService.ts`)
- Schema-validated bulk CSV/Excel/JSON import engine with template downloads and field mapping for Clients, BOQ Items, Product Variants, Suppliers, Inventory, and Personnel.

### 10.5 Global Settings & Access Control Center (`Settings.tsx` — `view = 'settings'`)
- Configures Company Profile, Branding & Logos, Tax/VAT defaults, Currency, Bank Accounts, PDF Document Defaults, and houses the **Security, RBAC & Cloud Collaboration Suite**.

---

## 11. COMPLETE ROLE-BASED ACCESS CONTROL (RBAC), PERMISSIONS & SEGREGATION OF DUTIES (SOD)

### 11.1 Organizational Departments (`DepartmentCode`)
1. **`OPERATIONS`:** Project Management, Planning, Execution, Quality, Products & Fabrication, Resource Allocation, Engineering, Site Management, Documentation, Project Reporting.
2. **`COMMERCIAL_ADMIN`:** Finance, HR, Payroll, Administration, Accounting, Company Management, Management Reporting.
3. **`PROCUREMENT_SUPPLY_CHAIN`:** Supplier Management, RFQ & Tendering, Purchasing, Purchase Orders, Goods Received (GRN), Supplier Evaluation, Procurement Analytics.
4. **`MANAGEMENT` / `SYSTEM`:** Executive Governance, Identity & Access Security, System Audit & Compliance.

### 11.2 All 21 Pre-Configured RBAC Roles (`SEED_ROLES`)

| # | Role Code | Role Name | Department | Default Scope | Core Authority Summary |
|---|---|---|---|---|---|
| 1 | `SUPER_ADMIN` | **Super Administrator** | `SYSTEM` | `Global` | Unconstrained authority across all 24 modules and all 480 permission codes. |
| 2 | `SYSTEM_ADMIN` | **System Administrator** | `COMMERCIAL_ADMIN` | `Global` | Manages user accounts, MFA, roles, security policies, company config, and global view/admin access. |
| 3 | `DEPT_ADMIN` | **Department Administrator** | `OPERATIONS` | `Department` | Full administrative control over Operations workflows, projects, planning, QC, resources, and sites. |
| 4 | `MANAGING_DIRECTOR` | **Managing Director** | `COMMERCIAL_ADMIN` | `Global` | Global view, export, and final approval (`*.approve`) authority across all departments and executive reports. |
| 5 | `OPERATIONS_MANAGER` | **Operations Manager** | `OPERATIONS` | `Department` | Full supervisory authority over projects, planning, QC, BOQ, resources, equipment, sites, and engineering. |
| 6 | `PROJECT_MANAGER` | **Project Manager** | `OPERATIONS` | `Project` | End-to-end execution, WBS planning, BOQ lock/submit, resource allocation, permit creation, and invoice drafts on assigned projects. |
| 7 | `PROJECT_COORDINATOR` | **Project Coordinator** | `OPERATIONS` | `Project` | Schedule updates, document uploads/downloads, and read visibility across assigned project modules. |
| 8 | `SITE_MANAGER` | **Site Manager** | `OPERATIONS` | `Branch` | On-site construction control, PTW work permits, incident reporting, equipment allocation, and QC inspection requests. |
| 9 | `SITE_SUPERVISOR` | **Site Supervisor** | `OPERATIONS` | `Project` | Direct field/shop crew supervision, daily site logs, incident reporting, and initial QC inspection creation. |
| 10 | `ENGINEER` | **Engineer** | `OPERATIONS` | `Project` | Engineering specs, shop/fabrication drawings, structural calculations, and technical document control. |
| 11 | `QUANTITY_SURVEYOR` | **QS (Quantity Surveyor)** | `OPERATIONS` | `Department` | BOQ formulation, measurement takeoff, variation valuations, BOQ locking, and progress invoice submission. |
| 12 | `QUALITY_MANAGER` | **Quality Manager** | `OPERATIONS` | `Department` | ITP approval, NCR closure (`qc.approve` / `qc.reject`), quality record locking, and warranty certification. |
| 13 | `QUALITY_INSPECTOR` | **Quality Inspector** | `OPERATIONS` | `Assigned Records` | Shop and site tolerance inspections, MTC verification, and initial NCR filing (`qc.create`, `qc.submit`). |
| 14 | `RESOURCE_MANAGER` | **Resource Manager** | `OPERATIONS` | `Department` | Workforce roster management, crew deployment, timesheet approval, and plant equipment assignment. |
| 15 | `FINANCE_MANAGER` | **Finance Manager** | `COMMERCIAL_ADMIN` | `Department` | Invoice approval/rejection, GL & AP/AR sign-off, payroll approval, and financial statement export. |
| 16 | `ACCOUNTANT` | **Accountant** | `COMMERCIAL_ADMIN` | `Department` | AR/AP booking, journal vouchers, bank reconciliation, VAT filing preparation, and financial reporting. |
| 17 | `FINANCE_OFFICER` | **Finance Officer** | `COMMERCIAL_ADMIN` | `Department` | Billing entry, receipt vouchers, petty cash recording, and customer ledger updates. |
| 18 | `HR_MANAGER` | **HR Manager** | `COMMERCIAL_ADMIN` | `Department` | Full HR lifecycle approval, employee master admin, compensation setup, and payroll cycle submission. |
| 19 | `HR_OFFICER` | **HR Officer** | `COMMERCIAL_ADMIN` | `Department` | Employee records, visa/document compliance, shift attendance, and leave administration. |
| 20 | `ADMIN_OFFICER` | **Admin Officer** | `COMMERCIAL_ADMIN` | `Branch` | Branch facility documents, company profile viewing, and general document uploads/downloads. |
| 21 | `PROCUREMENT_MANAGER` | **Procurement Manager** | `PROCUREMENT_SUPPLY_CHAIN` | `Department` | Supplier qualification approval, RFQ award, PO authorization (`po.approve`), and spend analytics. |
| 22 | `PROCUREMENT_OFFICER` | **Procurement Officer** | `PROCUREMENT_SUPPLY_CHAIN` | `Department` | PR processing, RFQ bidding, PO creation/submission, and GRN tracking. |
| 23 | `BUYER` | **Buyer** | `PROCUREMENT_SUPPLY_CHAIN` | `Assigned Records` | Spot purchasing, RFQ creation, and draft PO preparation. |
| 24 | `SUPPLIER_MANAGER` | **Supplier Manager** | `PROCUREMENT_SUPPLY_CHAIN` | `Department` | Vendor onboarding, compliance audits, and supplier scorecard evaluation approvals. |

### 11.3 Granular Permission Matrix (`24 Modules × 20 Actions = 480 Permissions`)
- **24 Permission Modules (`prefix`):**
  `project`, `planning`, `qc`, `boq`, `resource`, `equipment`, `site`, `engineering`, `doc`, `proj_report`, `invoice`, `accounting`, `hr`, `payroll`, `company`, `mgmt_report`, `supplier`, `rfq`, `po`, `grn`, `supplier_eval`, `proc_analytics`, `security`, `audit`.
- **20 Standard Actions (`PermissionAction`):**
  `view` (Low), `create` (Medium), `edit` (Medium), `delete` (High), `submit` (Low), `approve` (High), `reject` (Medium), `assign` (Medium), `transfer` (Medium), `import` (Medium), `export` (High), `upload` (Low), `download` (Medium), `print` (Low), `archive` (High), `restore` (High), `lock` (High), `unlock` (Critical), `configure` (High), `admin` (Critical).
- **8 Data Access Scopes (`AccessScopeType`):**
  `Global` > `Department` > `Branch` > `Team` > `Project` > `Assigned Records` > `Own Records` > `Restricted`.

### 11.4 Segregation of Duties (SoD) Rules (`SEED_SOD_RULES`)
1. **`SOD-PO-PAY` (Strict Block):** *PO Creation vs. Payment Approval* — A user with `po.create` cannot simultaneously hold `invoice.approve`.
2. **`SOD-PO-GRN` (Strict Block):** *Purchasing vs. Goods Received Sign-Off* — A user with `po.approve` cannot simultaneously hold `grn.approve`.
3. **`SOD-QC-CLOSE` (Warning):** *NCR Inception vs. Unilateral Closure* — A Quality Inspector who raises an NCR (`qc.create`) cannot close it without Quality Manager concurrence (`qc.approve`).
4. **`SOD-VAR-EST` (Warning):** *BOQ Rate Formulation vs. Budget Release* — Quantity Surveyors editing base BOQ rates (`boq.edit`) cannot unilaterally approve client variations (`project.approve`).

### 11.5 Advanced Security Controls
- **Account Status Lifecycle:** `Pending Activation` → `Active` ↔ `Inactive` / `Suspended` / `Locked` (auto-locks after 5 failed login attempts) → `Terminated`.
- **MFA Enforcement:** Supports `TOTP` (Authenticator App) and `EMAIL_OTP`.
- **Temporary Access Grants (`TemporaryAccessGrant`) & Delegations (`PermissionDelegation`):** Time-bound authority elevation with automatic expiry and audit logging.

---

## 12. CLOUD COLLABORATION ECOSYSTEM (ACCOUNT CATEGORIES, TYPES, SUBTYPES & 23 INFORMATION CATEGORIES)

Managed via `collaborationService.ts` (`src/types/collaboration.ts`) inside **System > Security & RBAC**:

### 12.1 Five Master Account Categories (`AccountCategory`)
1. **`INTERNAL`:** Internal leadership, project managers, engineers, QS, site supervisors, factory managers, QA/QC, HSE, procurement, finance, and storekeepers.
2. **`PROFESSIONAL`:** External Architects, Lead Consultants, Structural Engineers, Facade Consultants, Acoustic/Fire Specialists, and Chartered QS firms.
3. **`COMMERCIAL`:** Main Contractors, Subcontractors, External Fabricators, Material Suppliers, Logistics Providers, and Sales/Referral Agents.
4. **`CLIENT`:** Project Owners, Developers, Client Representatives, Facility Managers, and End-User Tenants.
5. **`SPECIALIST`:** Third-Party Testing Labs (CWCT/NDT), Municipal Authorities (Civil Defense/Municipality), Legal Advisors, and External Auditors.

### 12.2 The 23 Project Information Categories (`InformationCategory`)
Every Collaborator Account and Project Team Member has a granular permission matrix across **23 Information Categories** × **7 Permission Actions (`VIEW`, `UPDATE`, `UPLOAD`, `SHARE`, `DOWNLOAD`, `COMMENT`, `MANAGE`)**:
`General`, `Sales`, `Client`, `Design`, `Architecture`, `Engineering`, `QS/Commercial`, `Site`, `Fabrication`, `Procurement`, `Materials`, `Workforce`, `Quality`, `Safety`, `Contract`, `Finance`, `Invoice`, `Progress`, `Photos`, `Drawings`, `Communication`, `Completion`, `Warranty`.

---

## 13. END-TO-END SYSTEM WORKFLOWS & STAGE-GATE STATE MACHINES

### Workflow 1: Commercial Quotation-to-Project-to-Invoice Pipeline
1. **Client & Inquiry Registration:** Create client profile in `Clients CRM` with credit limit, tax status, and contact persons.
2. **BOQ Engineering & Estimation:** Build quotation in `Quote Editor` using Master Catalog items, Variant Matrix configurations, Geometric Measurement Sheets, and Technical Specifications.
3. **Internal Review & Dispatch:** Advance quote through `Draft` → `Site Visit` → `Internal Review` → `Sent` (with Revision history tracking).
4. **Award & Project Charter Conversion:** Mark quote as `Won` and convert to an active `Project` with locked baseline sum, payment milestones, and WBS phases.
5. **Variation Management:** Any scope changes are recorded in `Variation Manager` (`Additional` / `Omitted` items), updating the revised contract value upon approval.
6. **Milestone Billing & Accounting Posting:** Generate progress/milestone tax invoices in `Invoices`, post to `Accounts Receivable (AR)` and `General Ledger (GL)`, track retention holdbacks, and issue `Warranty Certificates` upon handover.

### Workflow 2: Factory Project Assignment & 16-Stage Execution Gate
1. **Factory Card Selection:** Open the `Factories` portal landing page to view all factories as cards with live capacity and performance metrics.
2. **Assign Project (`Assign Project` button):** Select a project to assign to a factory. The system automatically links the project's **Client**, **Site Address**, **Project Code**, **Contract Value**, and **BOQ Items**, and creates the **Work Package (`FWP`)**, **Execution Plan Phases**, and **Initial Tasks**.
3. **16-Stage Factory Execution Gate (`ExecutionStageStatus`):**
   $$\text{Draft} \rightarrow \text{Assigned} \rightarrow \text{Planned} \rightarrow \text{Ready} \rightarrow \text{In Progress} \rightarrow \text{Submitted for Inspection} \rightarrow \begin{cases} \text{Approved} \rightarrow \text{Completed} \rightarrow \text{Packed} \rightarrow \text{Dispatched} \rightarrow \text{Delivered} \rightarrow \text{Installed} \rightarrow \text{Accepted} \rightarrow \text{Closed} \\ \text{Rejected / Rework Required} \rightarrow \text{In Progress (Rework Loop)} \end{cases}$$
4. **Task & Document Execution:** Engineers and supervisors add tasks, manage the execution plan, upload any supporting document types (`PDF`, `DWG`, `XLSX`, `DOCX`, `PNG`, `MP4`, `ZIP`) to tasks, issue raw materials from inventory, and log `Digital Worksheets` (`DWS`) and `Daily Factory Activity Reports` (`DFAR`).
5. **Supervisor Hub Workflow:** In `Hub`, the Factory Supervisor steps each assigned project through `Start Work` → `Submit QC` → `Approve QC` (or `Rework`) → `Pack Items` → `Deliver Site` → `Complete All`.

### Workflow 3: Procure-to-Pay (P2P) & Cryptographic 3-Way Match
1. **BOM Cost & Requisition:** Material requirements originate from BOQ/BOM Cost Items or site `Purchase Requisitions (PR)` with real-time budget checking.
2. **Sourcing & Reverse Auction:** Convert PR to `RFQ` for multi-bid comparison or launch a live `Reverse Dutch Auction`.
3. **Purchase Order & Dual Auth:** Issue `Purchase Order (PO)` with framework rate lock validation.
4. **Inbound Logistics & QC:** Record physical delivery via `Goods Receipt Note (GRN)` or `Service Completion Note (SCN)` with barcode scanning and Incoming QC (`IQC` / `MTC`) inspection. If defective, raise a `Procurement NCR` which places an automatic payment hold.
5. **3-Way Match & PVC Token Release:** Match `PO` + `GRN/SCN` + `Supplier Invoice`. Upon 100% match verification, generate an HMAC-SHA256 `Payment Verification Code (PVC)` authorizing Accounts Payable disbursement.

### Workflow 4: Biometric Attendance, Meal Scanning & Sri Lankan Statutory Payroll
1. **Biometric / Laser Terminal Scan:** Employee scans at a terminal (`CHECK_IN`). The system verifies shift start time, logs late minutes if applicable, and sets state to `ARRIVED` (enforcing that the next punch is `LEAVE_OUT` / `CHECK_OUT`).
2. **Overtime & Meal Scanning:** Approved overtime hours are tracked via `OT_IN` / `OT_OUT` punches; canteen scans (`MEAL_TEA_SCAN`) deduct from or track against the company-allocated meal fund (automatically crediting unclaimed company-funded meal balances to employee benefits).
3. **Automated Paysheet & EPF/ETF/Gratuity Calculation:** The payroll engine computes Basic + EPF-Eligible Allowances, adds OT pay, bonuses, contract payouts, commissions, and unclaimed meal benefits, deducts **8% Employee EPF**, loan installments (principal + interest), late penalties, and APIT tax, and computes **12% Employer EPF**, **3% Employer ETF** (23% total statutory contribution), and **Gratuity Provision (`0.5 × Basic × Years`)**.

---

## 14. MASTER DOCUMENT REGISTRIES (89 PROCUREMENT FORMS + 25 FACTORY OPERATIONAL DOCUMENTS + PDF ENGINES)

### 14.1 All 89 Official Procurement & Supply Chain Documents (`ALL_89_PROCUREMENT_DOCUMENTS`)

#### Group 1: Setup & Master Procurement Documents (Docs 1–22)
1. `PROC-DOC-001` — Corporate Procurement Policy & Governance Charter
2. `PROC-DOC-002` — Delegation of Financial & Purchasing Authority (DOA) Matrix
3. `PROC-DOC-003` — Master Vendor Registration & Pre-Qualification Application
4. `PROC-DOC-004` — Supplier Code of Conduct & Ethical Compliance Declaration
5. `PROC-DOC-005` — Vendor Financial Solvency & Bank Reference Verification Form
6. `PROC-DOC-006` — Supplier ISO 9001 / 14001 / 45001 Quality & HSE Audit Checklist
7. `PROC-DOC-007` — Factory Production Capacity & Machinery Assessment Report
8. `PROC-DOC-008` — Approved Vendor List (AVL) Master Register
9. `PROC-DOC-009` — Master Framework Supply Agreement (Price Lock Contract)
10. `PROC-DOC-010` — Subcontractor Master Service Level Agreement (SLA)
11. `PROC-DOC-011` — Corporate Non-Disclosure & Confidentiality Agreement (NDA)
12. `PROC-DOC-012` — Conflict of Interest & Anti-Bribery Disclosure Form
13. `PROC-DOC-013` — Standard Terms & Conditions of Purchase (General Goods)
14. `PROC-DOC-014` — Standard Terms & Conditions for Specialist Façade Subcontracts
15. `PROC-DOC-015` — Material Coding, Taxonomy & SKU Master Specification
16. `PROC-DOC-016` — Minimum Order Quantity (MOQ) & Tiered Rate Card Schedule
17. `PROC-DOC-017` — Incoterms 2020 & International Freight Responsibility Matrix
18. `PROC-DOC-018` — Customs Clearance, HS Code & Import Duty Tariff Schedule
19. `PROC-DOC-019` — Letter of Credit (LC) & Bank Guarantee Application Template
20. `PROC-DOC-020` — Advance Payment Bond & Performance Security Format
21. `PROC-DOC-021` — Quarterly Vendor Scorecard & Performance Appraisal Form
22. `PROC-DOC-022` — Vendor De-Registration, Suspension & Blacklisting Notice

#### Group 2: Project Procurement Documents (Docs 23–40)
23. `PROC-DOC-023` — Project Procurement Execution Plan (PPEP)
24. `PROC-DOC-024` — Project Long-Lead Item (LLI) Expediting Schedule
25. `PROC-DOC-025` — Project Work Breakdown & Procurement Packaging Matrix
26. `PROC-DOC-026` — Project Material Budget vs. Committed Spend Control Sheet
27. `PROC-DOC-027` — Tender Event Schedule & Procurement Milestone Tracker
28. `PROC-DOC-028` — Project Specific Vendor Prequalification Dossier
29. `PROC-DOC-029` — Client / Consultant Material Submittal & Approval Log (MAR)
30. `PROC-DOC-030` — Country of Origin & Manufacturer Compliance Declaration
31. `PROC-DOC-031` — Project Subcontract Scope of Works (SOW) Responsibility Matrix
32. `PROC-DOC-032` — Site Logistics, Cranage & Delivery Slot Booking Schedule
33. `PROC-DOC-033` — Project Material Risk Register & Supply Chain Contingency Plan
34. `PROC-DOC-034` — Value Engineering (VE) & Cost Saving Proposal Form
35. `PROC-DOC-035` — Project Variation Procurement Impact Assessment
36. `PROC-DOC-036` — Back-to-Back Subcontract Commercial Terms Addendum
37. `PROC-DOC-037` — Project Sample Board & Mock-Up Approval Sign-Off Sheet
38. `PROC-DOC-038` — Project Spare Parts & Attic Stock Handover Schedule
39. `PROC-DOC-039` — Project Procurement Closeout & Reconciliation Certificate
40. `PROC-DOC-040` — Project Lessons Learned — Supply Chain & Vendor Review

#### Group 3: Material & Requirements Documents (Docs 41–60)
41. `PROC-DOC-041` — Bill of Materials (BOM) Master Engineering Takeoff
42. `PROC-DOC-042` — Material Take-Off (MTO) — Aluminium Extrusion Profiles
43. `PROC-DOC-043` — Material Take-Off (MTO) — Architectural Glass & DGU Panels
44. `PROC-DOC-044` — Material Take-Off (MTO) — Structural Steel & Embeds
45. `PROC-DOC-045` — Material Take-Off (MTO) — EPDM Gaskets, Weatherstrips & Seals
46. `PROC-DOC-046` — Material Take-Off (MTO) — Structural & Weather Silicone Sealants
47. `PROC-DOC-047` — Material Take-Off (MTO) — Fenestration Hardware & Ironmongery
48. `PROC-DOC-048` — Material Take-Off (MTO) — Anchor Fasteners, Brackets & Fixings
49. `PROC-DOC-049` — Material Take-Off (MTO) — ACP / Solid Aluminium Cladding Sheets
50. `PROC-DOC-050` — Purchase Requisition (PR) — Standard Project Materials
51. `PROC-DOC-051` — Purchase Requisition (PR) — Emergency / Safety Fast-Track
52. `PROC-DOC-052` — Request for Information (RFI) — Commercial & Supply Chain
53. `PROC-DOC-053` — Request for Quotation (RFQ) — Standard Material Inquiry
54. `PROC-DOC-054` — Request for Proposal (RFP) — Specialist Turnkey Subcontract
55. `PROC-DOC-055` — Commercial Bid Tabulation & Equalization Matrix (CBE)
56. `PROC-DOC-056` — Technical Bid Evaluation & Compliance Report (TBE)
57. `PROC-DOC-057` — Reverse Dutch Auction Event Charter & Bidding Rules
58. `PROC-DOC-058` — Single-Source / Sole-Vendor Justification & Waiver Form
59. `PROC-DOC-059` — Letter of Intent (LOI) / Letter of Award (LOA)
60. `PROC-DOC-060` — Official Purchase Order (PO) — Standard Commercial Contract

#### Group 4: Technical, Logistics & Governance Procurement Documents (Docs 61–89)
61. `PROC-DOC-061` — Blanket / Call-Off Purchase Order Release Form
62. `PROC-DOC-062` — Purchase Order Amendment / Variation Order (PO-VO)
63. `PROC-DOC-063` — Aluminium Billet & Die Tooling Ownership Agreement
64. `PROC-DOC-064` — Extrusion Die Trial & Profile Section Approval Report
65. `PROC-DOC-065` — Powder Coating / PVDF Surface Finish Warranty & Spec Sheet
66. `PROC-DOC-066` — Architectural Glass Thermal & Optical Performance Data Sheet
67. `PROC-DOC-067` — Structural Silicone Compatibility & Adhesion Test Request
68. `PROC-DOC-068` — Factory Expediting & Production Progress Visit Report
69. `PROC-DOC-069` — Pre-Shipment Inspection & Packing Verification Checklist
70. `PROC-DOC-070` — Commercial Invoice, Packing List & Certificate of Origin Check
71. `PROC-DOC-071` — Shipping Release Note & Freight Forwarder Dispatch Instruction
72. `PROC-DOC-072` — Gate Entry Pass & Vehicle Weighbridge Security Log
73. `PROC-DOC-073` — Official Goods Receipt Note (GRN) — Warehouse Inbound
74. `PROC-DOC-074` — Incoming Material Inspection & Mill Test Certificate (MTC) Log
75. `PROC-DOC-075` — Material Quarantine, Rejection & Return-to-Vendor (RTV) Note
76. `PROC-DOC-076` — Supplier Non-Conformance Report (Procurement NCR)
77. `PROC-DOC-077` — Subcontractor Service Completion Note (SCN) & Valuation
78. `PROC-DOC-078` — Warehouse Material Issue Slip (MIS) to Factory / Site
79. `PROC-DOC-079` — Inter-Branch / Inter-Project Material Transfer Note (MTN)
80. `PROC-DOC-080` — Excess Material Return-to-Store (RTS) Credit Voucher
81. `PROC-DOC-081` — Scrap Declaration & 7-Day Internal Reclamation Intercept Form
82. `PROC-DOC-082` — Scrap Weighment, Sale & Gate Pass Liquidation Record
83. `PROC-DOC-083` — Cycle Count & Physical Inventory Stocktake Reconciliation
84. `PROC-DOC-084` — 3-Way Match Verification Certificate (PO + GRN + Invoice)
85. `PROC-DOC-085` — Cryptographic Payment Verification Code (PVC) Authorization
86. `PROC-DOC-086` — Supplier Debit Note / Back-Charge Deduction Voucher
87. `PROC-DOC-087` — Subcontractor Retention Release & Final Account Statement
88. `PROC-DOC-088` — No-Claim & Final Lien Waiver Certificate from Vendor
89. `PROC-DOC-089` — Annual Supply Chain Spend Intelligence & HHI Concentration Audit

### 14.2 All 25 Factory & Site Operational Documents (`GeneratedFactoryDocType`)
1. `Work Order (WO)`
2. `Job Card (JC)`
3. `Production Order (PO-FAB)`
4. `Task Assignment Sheet`
5. `Digital Worksheet Printout`
6. `Fabrication Sheet`
7. `Profile & Sheet Cutting List`
8. `Material Issue & Consumption Record`
9. `Factory Inspection Request (FIR)`
10. `Quality Inspection Report (QIR)`
11. `Daily Factory Activity Report (DFAR)`
12. `Weekly Progress & Earned Value Report`
13. `Work Package Completion Certificate`
14. `Crate & Pallet Packing List`
15. `Site Delivery Note (DN)`
16. `Gate Pass & Dispatch Record`
17. `Factory Acceptance Certificate (FAC)`
18. `Rework Instruction & Rectification Sheet`
19. `Non-Conformance Report (NCR)`
20. `Machine Preventive Maintenance Record`
21. `Factory HSE Toolbox & Permit Record`
22. `Attendance-Linked Production Sheet`
23. `Photographic Evidence Dossier`
24. `Site Installation Handover Certificate`
25. `Project & Factory Closeout Dossier`

---

## 15. SERVICE LAYER, CENTRAL API GATEWAY & DATA PERSISTENCE ARCHITECTURE

| Service File | Domain Responsibility & Key Methods |
|---|---|
| `src/services/centralApiGateway.ts` | Unified cross-portal event bus, notification dispatcher, and global state orchestrator. |
| `src/services/factoryExecutionService.ts` | Manages Factories, Project-to-Factory Assignments (`addWorkPackageAssignment`), Execution Plans (`addExecutionPlanItem`, `updateExecutionPlanItem`), Tasks (`addTask`, `updateTaskProgress`), Universal Task File Uploads (`uploadTaskSupportingDocument`), Supervisor Workflow (`advanceSupervisorWorkflow`), Digital Worksheets, Daily Reports, Media Evidence, Factory QC Inspections, Dispatches, Controlled Drawings, 25 Generated Docs, and Offline Queue synchronization. |
| `src/services/procurementService.ts` | Manages Suppliers, PRs, RFQs, Reverse Auctions, POs, Framework Contracts, GRNs, SCNs, Supplier Invoices, 3-Way Matching, PVC HMAC-SHA256 Tokens, Procurement NCRs, Warehouse Inventory, Stock Movements, Scrap Reclamation, and Emergency Fast-Track POs. |
| `src/services/procurementCostService.ts` | Manages Procurement Cost Items, MOQ Price Ranges, Item Variants, and live BOM Cost-to-Product Variant dependency links. |
| `src/services/procurementAllDocsService.ts` | Serves all 89 Procurement Document Definitions (`docs1to22_setup.ts`, `docs23to40_project.ts`, `docs41to60_requirement.ts`, `docs61to89_technical.ts`) and populates project/vendor-bound form data. |
| `src/services/accountingControlService.ts` | Double-entry General Ledger, Chart of Accounts, Journal Vouchers, AR, AP, Bank & Petty Cash, Project WIP Costing, Retentions, T-Account Ledgers, Fixed Assets, VAT Returns, and Financial Statements. |
| `src/services/hrService.ts` | Complete 18-portal HR engine including Organization, ATS Recruitment, Employee Master, Biometric/Laser Terminals, Stateful Shift Attendance, Meal/Tea Scanning & Benefit Roll-Over, Employee Loans, Sri Lankan EPF/ETF/Gratuity Paysheet Calculator, Performance, LMS, Relations, and Exit Settlements. |
| `src/services/payrollService.ts` | Monthly WPS Payroll Cycles, Project Payroll Plans, Department Payroll Budgets, Statutory EPF/ETF/APIT Reconciliation, and Quick Payout Vouchers. |
| `src/services/qualityControlService.ts` | Corporate QA/QC ITP Inspections, Incoming QC (IQC & MTC), Lab/Water Hose Tests, NCR & Quarantine Control, and Gauge Calibration. |
| `src/services/safetyControlService.ts` | HSE Work Permits (PTW), Risk/JSA Control, Scaffold/PPE Tags, Toolbox Talks, Incident/CAPA Investigations, and Emergency Drills. |
| `src/services/equipmentControlService.ts` | Plant & CNC Machinery Registry, Preventive Maintenance, Breakdown Logs, and Pre-Start Inspections. |
| `src/services/securityService.ts` | RBAC Roles, 480 Permissions, Users, Active Sessions, Access Requests, Delegations, Segregation of Duties (SoD) Validator, and Security Audit Trail. |
| `src/services/collaborationService.ts` | 5-Category Cloud Collaboration Ecosystem, Account Types, Dynamic Subtypes, Organizations, Persons, Project Teams Matrix, and 23-Category Information Permissions. |
| `src/services/variantEngineService.ts` & `bomPricingService.ts` | Multi-attribute Product Variant generation, BOM formula calculation, and historical rate versioning. |
| `src/services/costEvaluationService.ts` | Project post-evaluation variance analysis comparing BOQ estimates against actual cross-portal costs. |
| `src/services/dataImportService.ts` & `dataExportService.ts` | Schema-validated CSV/Excel/JSON import and multi-format enterprise export engines. |
| `src/pdfGenerator.ts` | Client-side high-resolution PDF generation for Quotations, Variations, Tax Invoices, Statements, and Certificates. |
