# 001 - Roles and Permissions Overview

## 1. System Role Hierarchy

ITAMS uses an enterprise Role-Based Access Control (RBAC) architecture. Every authenticated identity is partitioned into one of three primary tiers, backed by dedicated PostgreSQL database tables and dedicated React layout consoles.

```
                               ┌──────────────────────┐
                               │   Supabase GoTrue    │
                               │     (auth.users)     │
                               └──────────┬───────────┘
                                          │ 1:1
                               ┌──────────▼───────────┐
                               │     public.users     │
                               │ (Base Identity & Role│
                               └──────────┬───────────┘
               ┌──────────────────────────┼──────────────────────────┐
               │ 1:1                      │ 1:1                      │ 1:1
    ┌──────────▼──────────┐    ┌──────────▼──────────┐    ┌──────────▼──────────┐
    │  public.itsd_users  │    │public.inventory_    │    │   public.end_users  │
    │                     │    │     staff_users     │    │                     │
    │  IT Systems & Admin │    │ Warehouse Custodian │    │ Personnel / Faculty │
    └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## 2. Role Specifications & Seed Accounts

All default accounts use the institutional master password: **`Password123!`**

### 2.1. ITSD Administrator (`itsd`)
- **Role Code**: `itsd`
- **Branding & Accent**: Crimson Red (`bg-red-700`, `text-red-500`, red aura glows)
- **Primary Mission**: Enterprise infrastructure monitoring, server hardware lifecycle, role assignments, security vault audit, and master asset controls.
- **Dedicated Table**: `public.itsd_users`
- **Default Seed User**:
  - **Full Name**: Alex Rivera (ITSD Admin)
  - **Email**: `itsd.admin@itams.edu`
  - **Login Alias**: `itsd.admin`
  - **Password**: `Password123!`
  - **Admin Level**: `Tier 3 Lead Admin`
  - **Specialization**: `IT Systems & Security Vault`
  - **Shift**: `Day Shift`
  - **Can Manage Assets**: `true`
- **Layout & Routing**:
  - Layout: [`src/layouts/itsd/ITSDLayout.jsx`](file:///d:/react-supabase-template/src/layouts/itsd/ITSDLayout.jsx)
  - Sidebar: [`src/layouts/itsd/ITSDSidebar.jsx`](file:///d:/react-supabase-template/src/layouts/itsd/ITSDSidebar.jsx)
  - Console: [`src/pages/itsd/ITSDDashboard.jsx`](file:///d:/react-supabase-template/src/pages/itsd/ITSDDashboard.jsx)

---

### 2.2. Inventory Staff (`inventory_staff`)
- **Role Code**: `inventory_staff`
- **Branding & Accent**: Cobalt Blue (`bg-blue-700`, `text-blue-500`, blue badge rings)
- **Primary Mission**: Physical stock control, warehouse bay allocations, barcode/RFID tracking, batch hardware intake, and decommission logistics.
- **Dedicated Table**: `public.inventory_staff_users`
- **Default Seed User**:
  - **Full Name**: Sarah Chen (Inventory Lead)
  - **Email**: `inventory.staff@itams.edu`
  - **Login Alias**: `inventory.staff`
  - **Password**: `Password123!`
  - **Warehouse Location**: `Central IT Warehouse - Bay 4`
  - **Inventory Tier**: `Lead Hardware Custodian`
  - **Badge Number**: `INV-0042`
- **Layout & Routing**:
  - Layout: [`src/layouts/inventory_staff/InventoryStaffLayout.jsx`](file:///d:/react-supabase-template/src/layouts/inventory_staff/InventoryStaffLayout.jsx)
  - Sidebar: [`src/layouts/inventory_staff/InventoryStaffSidebar.jsx`](file:///d:/react-supabase-template/src/layouts/inventory_staff/InventoryStaffSidebar.jsx)
  - Console: [`src/pages/inventory_staff/InventoryStaffDashboard.jsx`](file:///d:/react-supabase-template/src/pages/inventory_staff/InventoryStaffDashboard.jsx)

---

### 2.3. End User (`end_user`)
- **Role Code**: `end_user`
- **Branding & Accent**: Emerald Green (`bg-emerald-700`, `text-emerald-500`, green highlights)
- **Primary Mission**: Individual asset custody, device requisition requests, return submissions, and hardware incident ticket reporting.
- **Dedicated Table**: `public.end_users`
- **Default Seed User**:
  - **Full Name**: Michael Torres (Staff)
  - **Email**: `end.user@itams.edu`
  - **Login Alias**: `end.user`
  - **Password**: `Password123!`
  - **Department**: `Medical Faculty Operations`
  - **Employee ID**: `MED-7719`
  - **Job Title**: `Clinical Equipment Officer`
- **Layout & Routing**:
  - Layout: [`src/layouts/end_users/EndUserLayout.jsx`](file:///d:/react-supabase-template/src/layouts/end_users/EndUserLayout.jsx)
  - Sidebar: [`src/layouts/end_users/EndUserSidebar.jsx`](file:///d:/react-supabase-template/src/layouts/end_users/EndUserSidebar.jsx)
  - Console: [`src/pages/end_users/EndUserDashboard.jsx`](file:///d:/react-supabase-template/src/pages/end_users/EndUserDashboard.jsx)

---

## 3. RBAC Permissions Matrix

| Operational Capability | ITSD Admin (`itsd`) | Inventory Staff (`inventory_staff`) | End User (`end_user`) |
| :--- | :---: | :---: | :---: |
| **System Health & Server Telemetry** | Full Read/Write | None | None |
| **Manage User Accounts & Roles** | Full Read/Write | None | None |
| **Security Vault Audit Logs** | Full Read/Write | None | None |
| **Global Master Asset Registry** | Full Read/Write | Full Read/Write | Read Only (Assigned Only) |
| **Warehouse Bay & Shelf Allocations** | Read Only | Full Read/Write | None |
| **Stock Ingest & Hardware Commissioning** | Read Only | Full Read/Write | None |
| **Asset Decommissioning / Disposal** | Authorize & Confirm | Execute | None |
| **Custody Request Submissions** | Review & Approve | Fulfill & Dispatch | Create & Track |
| **Equipment Custody Return Filing** | Audit | Receive & Inspect | Submit Return Request |
| **Self Profile & Security Credentials** | Manage Self | Manage Self | Manage Self |

---

## 4. PostgreSQL Database Schema & Dedicated Tables

### 4.1. Base Table (`public.users`)
```sql
CREATE TYPE user_role AS ENUM ('itsd', 'inventory_staff', 'end_user');

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'end_user'::user_role,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2. ITSD Table (`public.itsd_users`)
```sql
CREATE TABLE public.itsd_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  admin_level TEXT NOT NULL DEFAULT 'Tier 2 Support',
  specialization TEXT DEFAULT 'Enterprise IT & Hardware Infrastructure',
  shift TEXT DEFAULT 'Day Shift',
  can_manage_assets BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3. Inventory Staff Table (`public.inventory_staff_users`)
```sql
CREATE TABLE public.inventory_staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  warehouse_location TEXT NOT NULL DEFAULT 'Central Depot - Building B',
  inventory_tier TEXT DEFAULT 'Full Custody & Stock Control',
  badge_number TEXT DEFAULT 'INV-8821',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4. End Users Table (`public.end_users`)
```sql
CREATE TABLE public.end_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  department TEXT NOT NULL DEFAULT 'Medical Faculty & Operations',
  employee_id TEXT DEFAULT 'EMP-9024',
  job_title TEXT DEFAULT 'Clinical Staff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Row-Level Security (RLS) Implementation

To ensure data confidentiality without recursive policy locks:
1. **Helper Function (`public.get_auth_user_role`)**:
   ```sql
   CREATE OR REPLACE FUNCTION public.get_auth_user_role()
   RETURNS user_role AS $$
     SELECT role FROM public.users WHERE id = auth.uid();
   $$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
   ```
   *Note: Using `SECURITY DEFINER` with fixed `search_path = public` prevents infinite recursion loops when RLS policies query the `public.users` table.*

2. **Access Policies**:
   - **`public.users`**: Each user reads their own record (`auth.uid() = id`). ITSD admins can view all users (`get_auth_user_role() = 'itsd'`).
   - **Dedicated Tables**: Each user can read their own specific role record (`auth.uid() = user_id`). ITSD admins maintain elevated visibility over all role tables.

---

## 6. Client-Side Session & Role Lifecycle

1. **Authentication Resolving (`AuthContext.jsx`)**:
   - `supabase.auth.onAuthStateChange` triggers upon sign-in.
   - Reads base record from `public.users`.
   - Concurrently fetches role-specific properties from `public.itsd_users`, `public.inventory_staff_users`, or `public.end_users` using `.maybeSingle()`.
   - Merges properties into `userProfile` and caches in state.
2. **Role Helper Hook (`useUserRole.js`)**:
   - Provides boolean flags: `isITSD`, `isInventoryStaff`, `isEndUser`.
   - Returns badge styles and localized role labels.
3. **Route Protection (`ProtectedRoute.jsx`)**:
   - Guards authenticated routes.
   - Checks if active role matches `allowedRoles`.
   - Automatically redirects unauthorized role attempts to the correct role dashboard.
4. **Profile & Credentials Interface (`/profile`, `/settings`)**:
   - Centralized in [`src/pages/ProfileSettingsPage.jsx`](file:///d:/react-supabase-template/src/pages/ProfileSettingsPage.jsx).
   - Exposes Identity info, raw database credentials/tokens, and interface preferences.
