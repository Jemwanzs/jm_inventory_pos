← [README](../README.md) · [Architecture](architecture.md) · [Database](database.md) · [Backend Architecture](backend-architecture.md) · [UI/UX](ui-ux.md) · [Screens](screens.md) · [Roadmap](roadmap.md) · [Deployment](deployment.md)

---

## 9. Core Modules

### A. Dashboard
Total stock value, low stock alerts, out-of-stock items, daily/monthly sales, purchases, stock movements, pending approvals, recent transactions, best-selling products, slow-moving stock, profit indicators, workspace performance.

### B. Settings and Configuration
The heart of the platform.

- **Business Settings** — name, logo, contact details, currency, tax settings, receipt footer, invoice notes, default payment terms
- **Workspace Settings** — branches, stores, warehouses, POS counters, departments, locations
- **Inventory Settings** — categories, brands, units of measure, stock valuation method, batch tracking, serial number tracking, expiry tracking, low stock thresholds, approval requirements, stock adjustment rules, purchase workflow rules
- **POS Settings** — receipt numbering, invoice numbering, payment methods, discount rules, return rules, sales approval rules, cashier access, shift open/close, daily sales closure, tax display rules
- **Workflow Settings** — approvals for new product creation, stock purchases, adjustments, transfers, write-offs, price changes, sales discounts, credit sales, returns/refunds
- **Notification Settings** — email alerts, in-app alerts, low stock alerts, approval reminders, sales closure notifications, stock movement notifications

### C. Product Management
Add/edit products, images, descriptions, categories, brands, units of measure, selling/cost prices, SKU/barcode, batch numbers, serial numbers, expiry dates, document attachments, activate/deactivate. Product fields configurable per business type via [Module AB, Dynamic Custom Fields](#ab-dynamic-custom-fields-engine).

Products are not flat single items — see [Module K, Product Variants](#k-product-variants) for the real data model.

### D. Stock Management
Opening stock, purchases, additions, transfers, adjustments, returns, write-offs, damaged/expired stock, stock counts (see [Module AD](#ad-stock-counting--physical-audit)), reconciliation, approvals, movement history.

Every stock action records: date, user, workspace, product, quantity, cost, reason, supporting documents, approval status, audit trail.

### E. Procurement and Purchases
Supplier management, purchase requests, purchase orders, goods received notes, supplier invoices, purchase receipts, cost updates, purchase approvals, document attachments.

### F. Sales and POS
Product search, barcode entry, product image display, cart management, quantity updates, discounts, tax calculation, payment recording, receipt/invoice/quotation/proforma generation, customer selection, cash and credit sales, sales returns, refund tracking, daily sales summary, cashier shift management.

No payment gateway integration at this stage — payments recorded manually. Methods: Cash, M-Pesa, Bank transfer, Card, Credit, other configurable methods.

### G. Customers
Profiles, contacts, credit limits, sales history, invoices, receipts, outstanding balances, documents. Credit-specific behavior is detailed in [Module P](#p-customer-credit-management).

### H. Suppliers
Profiles, contacts, purchase history, invoices, payment records, documents.

### I. Documents and Attachments
Attach documents to products, stock purchases/adjustments, sales, invoices, quotations, proformas, suppliers, customers, returns, approvals. Supported: receipts, quotations, proformas, invoices, delivery notes, supplier documents, stock photos, product images, and other supporting documents. Document layouts themselves are configurable — see [Module AM](#am-document-template-designer).

### J. Reports and Analytics
Downloadable in PDF, Excel, and CSV where applicable.

Reports: stock balance, stock movement, low stock, out-of-stock, stock valuation, sales (daily/monthly/product), profit, purchases, suppliers, customers, cashier, workspace, branch, inventory adjustments, returns, audit log.

Analytics: best/slow/fast-selling products, sales trends, stock trends, purchase trends, branch performance, cashier performance, product profitability, stock loss indicators.

### K. Product Variants
Products are a master record with variant children — required for realistic retail, not a flat item list.

- **Electronics:** iPhone 17 → 128GB Black, 128GB Silver, 256GB Black, 512GB Gold
- **Fashion:** T-Shirt → Small Red, Medium Red, Large Black
- **Hardware:** Paint → 1 litre, 5 litres, 20 litres

Data model: product master → product variants → SKU-level stock. Stock, pricing, and barcodes are tracked at the variant/SKU level, not the master product level.

### L. Advanced Pricing Engine
Businesses rarely sell at one price. Support **price lists** with:

- Retail price, wholesale price, VIP/customer-specific price
- Branch-specific pricing
- Bulk quantity pricing (price breaks by quantity)
- Promotional and time-based discounts
- Staff discounts

### M. Inventory Valuation Engine
Costing methods: FIFO, Weighted Average Cost, Last Purchase Cost (configurable per tenant, see [Inventory Settings](#b-settings-and-configuration)).

Reports: opening stock value, closing stock value, cost of goods sold (COGS), gross profit.

### N. Stock Reservation / Holding
Stock can be reserved against a quotation or pending order without being sold yet, so available-to-sell quantity reflects reality.

Item statuses: Available, Reserved, Sold, Damaged, Expired, Returned.

### O. Stock Lifecycle Tracking
For serialized/high-value items, track a full timeline per unit — e.g. a laptop by serial number: received (date, supplier) → transferred (warehouse → branch) → sold (date, customer) → warranty window. Builds on [stock movement history](#d-stock-management) and feeds [Module S, Warranty Management](#s-warranty-management).

### P. Customer Credit Management
For businesses selling on credit: credit customers, credit limits, payment terms, outstanding balances, partial payments, and **aging reports** (e.g. 0–30 days / 31–60 days / overdue buckets).

### Q. Cash Management
Cashier shift/session lifecycle for POS:

- Opening shift with a starting cash float
- Running expected cash = float + sales during shift
- Closing shift: actual counted cash vs. expected, with variance (shortage/excess) captured
- Supervisor approval required on variances

### R. Returns & Exchange Management
Returns are a first-class workflow, not a raw stock adjustment. Capture return reason (e.g. damaged), and a decision path: return to stock, repair, dispose, or return to supplier. Applies to both customer returns and supplier returns.

### S. Warranty Management
Warranty period, provider, and expiry per product/unit; claims history and repairs log. Primarily relevant to electronics and hardware tenants.

### T. Manufacturing / Production (Recipes & BOM)
A light production module for businesses that transform raw materials into finished goods — restaurants, printing, and branding businesses.

- **Restaurant example:** "Chicken meal" consumes chicken, oil, spices, packaging
- **Printing example:** "100 branded shirts" consumes blank shirts, ink, labour

Features: recipes / bill of materials (BOM), production orders, raw material stock, finished goods stock. Finished-goods sales automatically deduct component stock per the recipe.

### U. Restaurant / Hospitality Mode
A configurable business mode for hotels, restaurants, pubs, and bars, layered on top of core POS:

- Tables, waiters, kitchen order tickets
- Open bills, split bills
- Service charge, tips
- Menu items with recipes (uses [Module T](#t-manufacturing--production-recipes--bom))
- Bar inventory auto-deduction (e.g. selling 1 cocktail deducts 50ml gin, 100ml juice, ice per its recipe)

### V. Approval Inbox
A single, central place for all pending approvals across modules — new product, price change, stock adjustment, stock transfer, purchase, discount, refund. Shows "Pending My Approval," supports approve/reject with comments, and keeps full approval history. Workflow rules themselves are configured in [Workflow Settings](#b-settings-and-configuration); the hard maker ≠ checker constraint is enforced by [Module AF](#af-maker-checker-controls).

### W. Notification Center
In-app and email notifications for events: low stock, approval request, sale completed, stock received, failed stock count, user login, large discount. Which events fire and who they reach is driven by [Module AG, Notification Rules Builder](#ag-advanced-notification-rules-builder); this module is the runtime inbox/history of what was actually sent.

### X. Data Import & Migration Center
Bulk upload during tenant onboarding and ongoing use: products, customers, suppliers, opening stock, price lists, users. Provide downloadable Excel templates with built-in validation (e.g. category as a dropdown) to reduce import errors.

### Y. Backup & Data Recovery
Automatic backups, restore points, per-tenant data export, and a documented disaster recovery plan — expected by enterprise customers.

### Z. API & Integrations Layer
Built API-first from the start to support future integrations: accounting systems, e-commerce websites, payment providers, tax systems (see [ETR/eTIMS](roadmap.md#15-future-enhancements)), supplier systems. Requires API keys, webhooks, and integration logs for traceability.

### AA. AI Assistant Layer
A conversational assistant over the tenant's own data, answering questions such as:

- "Which products are losing money?" → margin/cost/price analysis with a recommendation
- "Show sales this month"
- "Predict products running out next week"
- "Compare branches"
- "Find suspicious stock adjustments" (surfaces findings from [Module AE](#ae-fraud-detection--risk-engine))

### AB. Dynamic Custom Fields Engine
Different industries collect different information — avoid rebuilding the schema per industry. Let tenants define custom fields on products, customers, suppliers, sales, and purchases.

- **Electronics:** IMEI number, processor, RAM size
- **Vehicle spare parts:** car model, year, engine type
- **Hotel:** room number, guest type

Field types: text, number, date, dropdown, checkbox, file upload.

### AC. Custom Numbering Engine
Universal, configurable document numbering — prefix, branch code, year, month, sequence length, separator. Examples: `PROD-001`, `INV-2026-0001`, `RCT-BR01-001`, `PO-2026-0001`. Applies to products, invoices, receipts, purchase orders, and any future numbered document.

### AD. Stock Counting / Physical Audit
Reconciles system stock vs. physical stock. Create a stock count session (e.g. "Branch A Stock Audit"), record expected vs. physical count, compute variance, then approve adjustment / investigate / attach evidence. Supports blind counting (counters don't see system quantity), multiple counters, and supervisor approval.

### AE. Fraud Detection & Risk Engine
Rule- and pattern-based anomaly detection surfaced as alerts: unusual discounts (e.g. a cashier who normally gives 5% suddenly gives 50%), excessive refunds, stock disappearing, price manipulation, after-hours sales, deleted transactions, frequent adjustments.

### AF. Maker-Checker Controls
The person who creates a sensitive action cannot approve it — a second authorized user must. Applies to purchases, adjustments, refunds, price changes, and user-permission changes. Enforced as a hard constraint (creator ≠ approver) on top of the workflow engine in [Module V](#v-approval-inbox).

### AG. Advanced Notification Rules Builder
Tenant-defined IF/THEN rules instead of fixed notification settings. E.g. "IF stock below 10 THEN email branch manager"; "IF sale above KES 500,000 THEN require approval." Conditions: product, amount, branch, user, customer, date.

### AH. Task Management
Lightweight task assignment — e.g. "confirm supplier delivery," "do monthly stock count," "review missing products." Tasks have owner, due date, priority, status, comments.

### AI. Employee Activity Tracking
Per-employee accountability: cashier (sales, refunds, discounts, cancelled sales), storekeeper (stock received, adjustments done, transfers approved). Rolls up into an employee productivity ranking report.

### AJ. Smart Search Engine
Global search across products, invoices, customers, suppliers, receipts, and documents as data volume grows. Use a dedicated search engine (Meilisearch or Typesense) rather than ad hoc SQL queries.

### AK. Offline Mode Architecture
POS must keep working when the internet drops: continue selling, print receipts, store transactions locally, then auto-sync and resolve conflicts when connectivity returns. Local storage via SQLite plus a sync engine.

### AL. Barcode & Label Printing
Barcode/QR generation, label templates, shelf labels, product stickers. Supports dedicated barcode scanners and phone-camera scanning.

### AM. Document Template Designer
User-customizable templates for invoices, receipts, quotations, and purchase orders — logo, colors, fields shown, footer, terms, signature — instead of one fixed layout per document type.

### AN. Communication Center
Templated outbound communication to customers/suppliers: payment reminders, quotation emails, invoice emails, order updates. Phase 1: email. Future: SMS, WhatsApp.

### AO. Data Retention & Compliance
Enterprise-grade control over how long audit logs, documents, and deleted records are kept, plus company data export and archiving of old records.

### AP. Multi-Language Support
Database designed to be translation-ready (English, French, Swahili, ...) even if only English ships in V1 — important if the platform expands beyond Kenya.

### AQ. Multi-Currency Support
Currency table (KES, USD, EUR, UGX, ...) with exchange rates, supplier currency, and reporting currency — added early since it's structurally invasive to retrofit later.

### AR. Inventory Intelligence Rules
Per-product smart rules: reorder level, reorder quantity, preferred supplier, lead time, expiry alerts, dead-stock alerts, overstock alerts, stock aging, and suggested purchase quantities. Feeds the [Dashboard](#a-dashboard) and procurement workflow.

### AS. Stock Ownership / Consignment
Not all stock on the shelf is owned by the business. Track ownership per stock unit — owned, consigned, supplier-owned — with commission-based settlement when consigned stock sells.

### AT. Multi-Unit Conversion
Buy, store, sell, and report the same product in different units via conversion factors — e.g. 1 carton = 24 pieces, 1 crate = 12 bottles, 1 kg = 1,000 g, 1 roll = 100 m. Critical for hardware, restaurant, and wholesale tenants.

### AU. Bundles, Kits and Combos
A sellable item composed of multiple component products — e.g. a laptop bundle (laptop + mouse + bag) or a meal combo (burger + fries + soda). Selling the bundle automatically reduces stock from every component, similar in mechanism to [Module T's](#t-manufacturing--production-recipes--bom) BOM deduction but without a production step.

### AV. Internal Requisition
Staff request stock from another location internally — e.g. a branch requesting stock from the warehouse. Flow: request → approval → dispatch → receive → close.

### AW. Dispatch and Delivery
For businesses that deliver goods: delivery notes, rider/driver assignment, dispatch status, proof of delivery, customer signature, delivery charges.

### AX. Expense Tracking
Basic operating expense capture (rent, fuel, packaging, casual labor, transport, electricity, repairs) so reporting can reflect real profit, not just sales margin.

### AY. Commission Management
Configurable commission for sales agents and waiters — by product, category, branch, salesperson, margin, or sales volume.

### AZ. Shift Handover Notes
At shift close, a cashier/storekeeper records pending orders, stock issues, cash variance explanation, damaged goods, and customer complaints for the next shift — complements [Module Q, Cash Management](#q-cash-management).

### BA. Price Change History
Every price change is tracked: old price, new price, reason, user, approval, effective date. Distinct from the audit log in that it's queryable as its own price timeline per product.

### BB. Margin Protection Rules
Prevent selling below cost unless explicitly allowed: block sale below cost, allow with manager PIN, allow only for selected roles, or require approval above a discount limit. Works alongside [Module AF, Maker-Checker](#af-maker-checker-controls).

### BC. Customer Order Management
Separates customer orders from direct POS sales for made-to-order or high-value work: order → deposit → fulfilment → delivery → balance payment → close. Relevant to printing, branding, furniture, electronics, and wholesale tenants.

### BD. Deposits and Layaway
Customers pay a deposit and collect later. Tracks deposit amount, remaining balance, reserved stock (via [Module N](#n-stock-reservation--holding)), expiry date, and cancellation policy.

### BE. Repairs / Service Jobs
For electronics and hardware businesses: customer item received, fault description, technician assigned, spare parts used (deducted from stock), service fee, warranty status, collection status.

### BF. Rental / Hire Module
For businesses that rent out equipment: item out, customer, due date, deposit, late fees, returned condition.

### BG. Franchise / Group Company Mode
Lets one parent company manage several independent businesses/tenants under a group — for future franchise or holding-company customers, layered on top of the existing [multi-tenant structure](architecture.md#3-multi-tenant-structure).

### BH. Data Locking Periods
After month-end close, sales and stock records before the lock date can't be edited unless an admin explicitly reopens the period — protects reporting integrity.

### BI. Approval Delegation
An approver who will be unavailable (e.g. on leave) can temporarily delegate their approval rights to another user for a date range, so approvals in [Module V](#v-approval-inbox) don't stall.

### BJ. Device and Counter Management
POS device inventory: device, counter name, assigned cashier, login history, printer setup, device status.

### BK. Receipt Printer Support
Support for Bluetooth, USB, network, kitchen, and barcode printers.

### BL. Kitchen Display System
For restaurants: orders route to kitchen screen, bar screen, or grill section with status tracking (pending, preparing, ready, served), visible to the cashier.

### BM. Table and Room Billing
For hospitality: tables, rooms, tabs, split bills, merge bills, service charge, waiter assignment — extends [Module U, Restaurant/Hospitality Mode](#u-restaurant--hospitality-mode).

### BN. Stock Wastage Tracking
For restaurants and bars: spillage, spoilage, expired items, preparation waste, staff meals — tracked separately from sales-driven stock deduction so wastage is visible in its own report.

### BO. Product Compliance Fields
For regulated products: expiry date, batch number, manufacturer, safety data sheet, warranty certificate, serial number, age-restricted item flag. Implemented as a built-in set on top of [Module AB, Custom Fields](#ab-dynamic-custom-fields-engine).

### BP. Import Validation Center
When users upload bulk data ([Module X](#x-data-import--migration-center)), show valid rows, failed rows, duplicate rows, missing fields, and the specific error reason, with a preview step before committing the import.

### BQ. Sandbox / Demo Tenant
A safe, isolated demo tenant where prospects can explore the system without touching or risking live tenant data.

### BR. Role Simulation
An admin can preview the app as a given role before assigning permissions — "View as Cashier," "View as Store Manager" — to sanity-check a permission set before it goes live.

### BS. Data Quality Center
Surfaces records that are missing, abnormal, or risky: products without cost price, products without category, negative stock, duplicate SKUs, sales without payment, stock without a supplier. A proactive cleanup dashboard rather than something a user has to stumble onto.

### BT. AI Assisted Configuration
Extends [Module AA, AI Assistant](#aa-ai-assistant-layer) to onboarding itself: a tenant admin describes their business in plain language (e.g. "I run a hardware shop with two branches and one warehouse") and the AI proposes modules, product fields, stock rules, reports, approval flows, and POS setup — a conversational alternative/companion to the [Business Setup Wizard](architecture.md#5-business-setup-wizard-first-time-configuration).
