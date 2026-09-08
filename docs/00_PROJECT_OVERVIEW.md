# 00 - ITAMS Project Overview

## 1. Executive Summary

**ITAMS** (IT Asset Management System) is an enterprise-grade hardware custody and infrastructure lifecycle management platform. Built on modern web standards with React 19, Vite, and Supabase, ITAMS provides role-segregated consoles for IT infrastructure administrators, warehouse inventory logistics personnel, and institutional end-users.

---

## 2. Core Architectural Pillars

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              ITAMS APPLICATION                               │
├───────────────────────────────┬──────────────────────────────────────────────┤
│ PRIMARY ENTRY ROUTE           │ /signin (strict, no public self-registration)│
├───────────────────────────────┼──────────────────────────────────────────────┤
│ AUTH & RBAC BACKEND           │ Supabase Auth (GoTrue) + PostgreSQL RLS      │
├───────────────────────────────┼──────────────────────────────────────────────┤
│ ROLE DATA TABLES              │ public.users, itsd_users,                    │
│                               │ inventory_staff_users, end_users             │
├───────────────────────────────┼──────────────────────────────────────────────┤
│ ROLE-SEPARATED DIRECTORIES    │ src/layouts/{role}/ & src/pages/{role}/      │
├───────────────────────────────┼──────────────────────────────────────────────┤
│ DESIGN SYSTEM                 │ Rounded-[5px] tokens, Dark/Light glass,      │
│                               │ Tailwind CSS, Framer Motion micro-animations │
└───────────────────────────────┴──────────────────────────────────────────────┘
```

### 2.1. Strict Seeded Authentication
- **No Self-Registration**: Public registration/signup has been completely decommissioned. Accounts are strictly provisioned by IT administrators via database seeds (`supabase/seed.sql`).
- **Primary Auth Route**: `/signin`. Legacy paths (`/login`, `/signup`, `/`) redirect automatically to `/signin` or `/dashboard`.
- **Username / Alias Login**: Accepts both canonical email (`itsd.admin@itams.edu`) and username alias (`itsd.admin`).

### 2.2. Dedicated Role-Based Layouts & Consoles
Rather than a shared monolithic dashboard, ITAMS separates layouts and pages by role into isolated module trees:
- `src/layouts/itsd/` & `src/pages/itsd/` (ITSD Admin Console - Crimson Red Theme)
- `src/layouts/inventory_staff/` & `src/pages/inventory_staff/` (Warehouse Logistics - Cobalt Blue Theme)
- `src/layouts/end_users/` & `src/pages/end_users/` (Custody Workspace - Emerald Green Theme)

### 2.3. Clean Unified Navigation & Collapsible Rail
- **Streamlined Sidebar**: Displays only the primary **Dashboard** link (icon: `LayoutDashboard`), removing distracting mock links.
- **Dynamic Centered Logo**: Features the official ITAMS logo, enlarging to `h-14` when open and condensing to `h-9` in rail mode.
- **Hover/Focus Full Overlay**: In collapsed desktop rail mode (`w-20`), hovering or focusing expanding the sidebar as an elevated `w-64` overlay over the dashboard without triggering page layout reflows.
- **Toggle State**: Displays **"Open Sidebar"** when collapsed and **"Collapse Sidebar"** when expanded.

---

## 3. Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | React 19 + Vite 6 | Fast SPA rendering, tree-shaking, fast HMR |
| **Routing** | React Router DOM v6 | Protected routing (`ProtectedRoute.jsx`), role guards |
| **Styling** | Tailwind CSS v4 | Curated color system, atomic tokens, `rounded-[5px]` |
| **Animations** | Framer Motion | Smooth dialog entry/exits, layout overlays, progress bars |
| **Icons** | Lucide React | Clean, recognizable system icons (`LayoutDashboard`, `LogOut`, etc.) |
| **Backend / DB** | Supabase (PostgreSQL 15) | Real-time database, Row-Level Security (RLS) policies |
| **Auth Provider** | Supabase GoTrue | Encrypted JWT tokens, password hashing, user metadata |

---

## 4. Key Directory Structure

```
d:/react-supabase-template/
├── docs/                                # Project documentation
│   ├── 00_PROJECT_OVERVIEW.md           # This document
│   ├── 001_ROLES_AND_PERMISSIONS.md     # Detailed RBAC and user tiers
│   ├── ARCHITECTURE_AND_CONVENTIONS.md  # Coding rules & patterns
│   ├── SEED_DATA.md                     # Database seed guide
│   └── zz_ARCHIVES.md                   # Legacy archives & bug resolution history
├── src/
│   ├── components/
│   │   ├── common/                      # Shared global components
│   │   │   ├── AuthLoadingScreen.jsx    # Full-screen branded loading screen
│   │   │   ├── SignOutDialog.jsx        # Portal-rendered sign-out confirmation
│   │   │   └── UserMenuDropdown.jsx     # Header profile & credentials dropdown
│   │   ├── features/auth/               # Auth cards & showcase
│   │   └── ui/                          # Button, Input, Card, Select
│   ├── context/
│   │   └── AuthContext.jsx              # Supabase session, role resolving, isAuthenticating
│   ├── hooks/
│   │   ├── useAuth.js                   # Hook for session, profile, and auth methods
│   │   ├── useSidebar.js                # Desktop collapse & mobile drawer state
│   │   └── useUserRole.js               # Role badges and display helper
│   ├── layouts/
│   │   ├── itsd/                        # ITSD Layout, Header, and Sidebar
│   │   ├── inventory_staff/             # Inventory Staff Layout, Header, and Sidebar
│   │   └── end_users/                   # End User Layout, Header, and Sidebar
│   ├── pages/
│   │   ├── itsd/                        # ITSD role dashboard
│   │   ├── inventory_staff/             # Warehouse depot dashboard
│   │   ├── end_users/                   # User equipment dashboard
│   │   ├── LoginPage.jsx                # /signin primary page
│   │   ├── ForgotPasswordPage.jsx       # Password recovery page
│   │   ├── DashboardPage.jsx            # Dynamic role-dispatching dashboard
│   │   └── ProfileSettingsPage.jsx      # /profile & /settings credentials portal
│   └── routes/
│       ├── AppRoutes.jsx                # Route hierarchy and navigation paths
│       └── ProtectedRoute.jsx           # Guard checking authentication & role clearance
└── supabase/
    └── seed.sql                         # Complete database schema, RLS, and seed data
```

---

## 5. Security & Session Handling

1. **Row Level Security (RLS)**:
   All database tables enforce strict RLS. Role determination is performed via `public.get_auth_user_role()`, a `SECURITY DEFINER` function that bypasses recursive RLS queries on `public.users`.
2. **Sign-Out Confirmation**:
   Sign out triggers a full-screen confirmation dialog ([`SignOutDialog.jsx`](file:///d:/react-supabase-template/src/components/common/SignOutDialog.jsx)) mounted directly to `document.body` via React Portals to prevent any sidebar clipping. Confirming terminates the session and safely redirects to `/signin`.
3. **Seamless Transition Loading**:
   During credential verification and route change, the root-level [`AuthLoadingScreen.jsx`](file:///d:/react-supabase-template/src/components/common/AuthLoadingScreen.jsx) ensures zero blank screens or layout flashes.
