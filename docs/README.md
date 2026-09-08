# ITAMS Documentation Index

Welcome to the IT Asset Management System (**ITAMS**) documentation repository. Follow the indexed guides below to understand the project architecture, security specifications, role hierarchy, and legacy archives.

---

## 📚 Documentation Index

| ID / File | Document Title | Description |
| :--- | :--- | :--- |
| **[`00`](./00_PROJECT_OVERVIEW.md)** | **[ITAMS Project Overview](./00_PROJECT_OVERVIEW.md)** | Core architectural pillars, technology stack, directory organization, and high-level design systems. |
| **[`001`](./001_ROLES_AND_PERMISSIONS.md)** | **[Roles and Permissions Overview](./001_ROLES_AND_PERMISSIONS.md)** | Detailed specifications for `itsd`, `inventory_staff`, and `end_user` roles, credentials, dedicated PostgreSQL tables, and the RBAC matrix. |
| **`ARCH`** | **[Architecture & Conventions Guide](./ARCHITECTURE_AND_CONVENTIONS.md)** | PascalCase/camelCase file naming standards, React Context auth, global state rules, and hook-first design principles. |
| **`SEED`** | **[Dedicated Role Tables & Seed Data Guide](./SEED_DATA.md)** | Database seed instructions, default accounts, and execution steps for `supabase/seed.sql`. |
| **[`zz`](./zz_ARCHIVES.md)** | **[Archives & Legacy Resolutions](./zz_ARCHIVES.md)** | Record of decommissioned workflows (public signup removal, sidebar simplification) and solutions to critical bugs (GoTrue 500, RLS recursion, 406 queries, portal trapping, blank redirect flashes). |

---

## 🚀 Quick Reference: Seed Credentials

Institutional Master Password: **`Password123!`**

| Role Code | Role Name | Seed Email / Alias | Accent Color | Dedicated Table |
| :--- | :--- | :--- | :--- | :--- |
| **`itsd`** | ITSD Administrator | `itsd.admin@itams.edu` (`itsd.admin`) | Crimson Red | `public.itsd_users` |
| **`inventory_staff`** | Inventory Staff Lead | `inventory.staff@itams.edu` (`inventory.staff`) | Cobalt Blue | `public.inventory_staff_users` |
| **`end_user`** | Clinical Equipment Officer | `end.user@itams.edu` (`end.user`) | Emerald Green | `public.end_users` |
