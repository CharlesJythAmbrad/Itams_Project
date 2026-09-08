# zz - Archives & Legacy Resolutions

## 1. Overview & Purpose

This document serves as the permanent historical log and technical archive for the ITAMS project. It details decommissioned architecture, legacy workflows, and critical bug resolutions encountered and solved during the platform's development.

---

## 2. Decommissioned Workflows & Deprecated Components

### 2.1. Decommissioning of Public Self-Signup
- **Previous State**: The application originally contained a `/signup` route with a self-service registration form (`SignUpPage.jsx`, `SignUpForm.jsx`).
- **Reason for Decommission**: ITAMS is an institutional enterprise asset tracking and infrastructure management system. Public registration created unauthorized accounts and violated role assignment integrity.
- **Current State**: Account provisioning is strictly restricted to IT administrators via database seeds (`supabase/seed.sql`) or future directory sync integrations. The primary entry point is `/signin`. All requests to `/signup` or `/register` automatically redirect to `/signin`.

### 2.2. Consolidation of Sign-In Route
- **Previous State**: Both `/login` and `/signin` existed interchangeably.
- **Current State**: Standardized on `/signin`. All legacy `/login` links and root redirects point directly to `/signin`. Supports dual input: canonical email (`itsd.admin@itams.edu`) and shorthand username alias (`itsd.admin`).

### 2.3. Removal of Redundant Sidebar User Profile Cards
- **Previous State**: The sidebar contained a mini user card ("Alex Rivera - Tier 3 Lead Admin") at the bottom of the navigation rail.
- **Reason for Removal**: The application header already provides a dedicated identity badge and interactive profile dropdown menu ([`UserMenuDropdown.jsx`](file:///d:/react-supabase-template/src/components/common/UserMenuDropdown.jsx)). The sidebar profile card caused visual clutter and layout crampedness when collapsed.
- **Current State**: Sidebar focuses purely on navigation. The bottom slot now houses the collapse toggle ("Open Sidebar" / "Collapse Sidebar") and the Sign Out action.

### 2.4. Streamlining Sidebar Navigation Links
- **Previous State**: Sidebars included numerous non-functional mock links (e.g., Reports, Settings, Inventory Sub-items).
- **Current State**: Sidebars are simplified to display only the primary **Dashboard** link using the official `LayoutDashboard` icon, guaranteeing a clean and focused user experience. Settings and Profile are accessed via the header menu.

---

## 3. Critical Bug Resolutions & Technical Gotchas

### 3.1. Supabase GoTrue 500 Error ("Database error querying schema")
- **Symptom**: Signing in with seed credentials triggered a `500: Database error querying schema` from Supabase GoTrue (`/auth/v1/token?grant_type=password`).
- **Root Cause**: Manual inserts into `auth.users` left internal GoTrue token fields (`confirmation_token`, `recovery_token`, `email_change_token_new`, etc.) as `NULL`. Supabase GoTrue expects non-null empty strings (`''`) for these columns and requires corresponding records in `auth.identities`.
- **Resolution**:
  1. Updated `supabase/seed.sql` to explicitly pass empty strings for all token fields.
  2. Added an automatic repair block executing `COALESCE(token, '')` on all `auth.users`.
  3. Added an automated `INSERT INTO auth.identities` block for all seeded users.

### 3.2. PostgreSQL RLS Infinite Recursion on `public.users`
- **Symptom**: Querying `public.users` resulted in `infinite recursion detected in policy for relation "users"` (PostgreSQL error `42P17`).
- **Root Cause**: An RLS policy on `public.users` evaluated user roles using a subquery: `USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'itsd')`. The subquery triggered the same RLS policy repeatedly.
- **Resolution**:
  Created a standalone helper function with `SECURITY DEFINER` and an explicit search path:
  ```sql
  CREATE OR REPLACE FUNCTION public.get_auth_user_role()
  RETURNS user_role AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
  $$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
  ```
  Policies were updated to use `public.get_auth_user_role() = 'itsd'`, bypassing recursive RLS checks cleanly.

### 3.3. Supabase PostgREST 406 Error on Profile Queries
- **Symptom**: When loading a user profile, the console logged `406 Not Acceptable` or `PGRST116: JSON object requested, multiple (or no) rows returned`.
- **Root Cause**: Calling `.single()` on dedicated role tables (`itsd_users`, `inventory_staff_users`, `end_users`) threw an unhandled exception if the specific role table row was empty or in the process of provisioning.
- **Resolution**:
  Replaced all `.single()` calls with `.maybeSingle()` across `AuthContext.jsx`. This gracefully returns `null` instead of throwing an HTTP 406 error, allowing the application to fall back gracefully.

### 3.4. Sign-Out Dialog Trapped / Clipped Inside Sidebar
- **Symptom**: Clicking "Sign Out" from the sidebar rendered the confirmation modal clipped inside the sidebar boundaries, distorted by CSS transforms and `overflow-hidden`.
- **Root Cause**: The modal was rendered as a direct child DOM element within the sidebar component tree.
- **Resolution**:
  Refactored [`SignOutDialog.jsx`](file:///d:/react-supabase-template/src/components/common/SignOutDialog.jsx) to utilize `ReactDOM.createPortal(..., document.body)`. The modal is now mounted at the root DOM level with `z-[9999]` and backdrop blur, unaffected by sidebar container styling.

### 3.5. Blank Screen Flicker During Sign-In & Redirect
- **Symptom**: After clicking "Sign In", the login form vanished, leaving a blank white or black screen for 1-2 seconds while waiting for the dashboard to mount.
- **Root Cause**:
  1. The login form unmounted immediately upon setting local loading state.
  2. React Router's `<AnimatePresence mode="wait">` waited for the exit animation to complete before rendering the next route.
  3. Supabase session state propagation created a micro-gap where neither login nor dashboard was actively rendered.
- **Resolution**:
  1. Introduced `isAuthenticating` state within `AuthContext.jsx` that maintains a 700ms smooth transition bridge.
  2. Built a full-screen, branded loading screen ([`AuthLoadingScreen.jsx`](file:///d:/react-supabase-template/src/components/common/AuthLoadingScreen.jsx)) featuring an animated ITAMS logo, status text, and a glowing progress indicator.
  3. Mounted `AuthLoadingScreen` at the application root (`App.jsx`), rendering instantly and bridging the gap smoothly until the dashboard is completely mounted.
