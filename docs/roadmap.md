← [README](../README.md) · [Architecture](architecture.md) · [Core Modules](modules.md) · [Database](database.md)

---

## 14. V1 Development Priorities

1. Secure admin-controlled onboarding
2. Multi-tenant business setup
3. Workspace and branch management
4. Role and permission management
5. Inventory configuration
6. Product management (including variants)
7. Stock movement tracking
8. POS sales flow
9. Manual payment recording
10. Reports and downloads
11. Document uploads
12. Full audit logs

Everything in the [Core Modules catalog](modules.md#9-core-modules) beyond this list — pricing engine, valuation, reservations, cash management, returns, warranties, production/hospitality modes, custom fields, custom numbering, stock counting, fraud detection, maker-checker, notification rules, tasks, employee tracking, smart search, offline mode, barcode/label printing, template designer, communication center, retention/compliance, multi-language, multi-currency, unit conversion, bundles, requisitions, dispatch, expenses, commissions, deposits/layaway, repairs, rentals, franchise mode, data locking, approval delegation, device management, kitchen display, data quality, API layer, AI assistant — is planned for later phases once the V1 core is stable. The schema, module-toggle design ([SaaS Platform & Subscription Management](architecture.md#4-saas-platform--subscription-management)), and schema-separation approach ([Platform & Infrastructure Architecture](architecture.md#platform--infrastructure-architecture)) should account for them from day one even though they ship later.

### Recommended fast-follow priorities

Once the V1 core above is working, these four modules give the platform an outsized jump in perceived power and adoptability relative to their build cost, so they're the recommended next tier rather than being left to "later phases" generically:

1. [Business Setup Wizard](architecture.md#5-business-setup-wizard-first-time-configuration) — including industry template presets
2. [Dynamic Custom Fields Engine](modules.md#ab-dynamic-custom-fields-engine)
3. Advanced Approval + Notification Rules — [Module AF](modules.md#af-maker-checker-controls) + [Module AG](modules.md#ag-advanced-notification-rules-builder)
4. [Data Quality Center](modules.md#bs-data-quality-center)

---

## 15. Future Enhancements

Barcode scanning, QR code labels, M-Pesa integration, accounting integration, ETR/eTIMS integration, customer loyalty, stock forecasting, demand prediction, mobile app publishing.

_(Offline POS, AI reporting, subscription billing, multi-currency, multi-language, and WhatsApp/SMS communication have been promoted into core scope — see [Module AK](modules.md#ak-offline-mode-architecture), [Module AA](modules.md#aa-ai-assistant-layer), [SaaS Platform & Subscription Management](architecture.md#4-saas-platform--subscription-management), [Module AQ](modules.md#aq-multi-currency-support), [Module AP](modules.md#ap-multi-language-support), and [Module AN](modules.md#an-communication-center).)_
