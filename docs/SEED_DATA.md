# Supabase Dedicated Role Tables & Seed Data Guide

This database schema organizes each role into its own dedicated table linked to the base `public.users` record:
- **`public.users`**: Base user entity (1:1 with `auth.users`).
- **`public.itsd_users`**: Dedicated table for IT Support & Systems Administrators.
- **`public.inventory_staff_users`**: Dedicated table for Asset Custodians & Warehouse Managers.
- **`public.end_users`**: Dedicated table for General Employees, Faculty & Requesters.

---

## 👥 Seed Accounts & Table Mappings

All accounts use the password: **`Password123!`**

| Role | Email | Name | Dedicated Table | Role-Specific Fields |
| :--- | :--- | :--- | :--- | :--- |
| **`itsd`** | `itsd.admin@itams.edu` | Alex Rivera (ITSD Admin) | `public.itsd_users` | `admin_level: 'Tier 3 Lead Admin'`, `specialization: 'IT Systems & Security Vault'`, `shift: 'Day Shift'`, `can_manage_assets: TRUE` |
| **`inventory_staff`** | `inventory.staff@itams.edu` | Sarah Chen (Inventory Lead) | `public.inventory_staff_users` | `warehouse_location: 'Central IT Warehouse - Bay 4'`, `inventory_tier: 'Lead Hardware Custodian'`, `badge_number: 'INV-0042'` |
| **`end_user`** | `end.user@itams.edu` | Michael Torres (Staff) | `public.end_users` | `department: 'Medical Faculty Operations'`, `employee_id: 'MED-7719'`, `job_title: 'Clinical Equipment Officer'` |

---

## 🗄️ Database Architecture

```
auth.users (Supabase Auth)
     │
     ▼ (1:1 cascade)
public.users (id, email, full_name, role)
     ├── (1:1) ──► public.itsd_users (user_id, admin_level, specialization, shift, can_manage_assets)
     ├── (1:1) ──► public.inventory_staff_users (user_id, warehouse_location, inventory_tier, badge_number)
     └── (1:1) ──► public.end_users (user_id, department, employee_id, job_title)
```

---

## 🚀 How to Run the Seed Script

1. Open your **[Supabase Dashboard](https://app.supabase.com/)**.
2. Go to **SQL Editor** -> **New query**.
3. Copy all of [`supabase/seed.sql`](file:///d:/react-supabase-template/supabase/seed.sql) and paste it into the editor.
4. Click **Run**.

The script will automatically create the tables, apply RLS security policies, attach the auto-provisioning trigger (`handle_new_user`), and seed all 3 test accounts into their respective role tables.
