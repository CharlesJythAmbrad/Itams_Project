# 🚀 Quick Fix: Assets Management Setup

## The Problem
You're getting a "404 - table 'public.assets' not found" error because the database schema hasn't been created yet.

## ✅ Solution (5 minutes)

### Step 1: Create the Database Schema
1. **Open your browser** and go to [Supabase Dashboard](https://supabase.com/dashboard)
2. **Select your project** (anzuiuoobrczdpbyjowe)
3. **Click "SQL Editor"** in the left sidebar
4. **Copy the entire content** from `supabase/complete_setup.sql`
5. **Paste it into the SQL Editor**
6. **Click "Run"** (bottom right green button)

You should see: ✅ "Successfully created assets table and inserted X sample assets."

### Step 2: Test the Application
1. **Go back to your React app** (should still be running with `pnpm dev`)
2. **Login as inventory staff**: `inventory.staff@itams.edu` / `Password123!`
3. **Click "Assets" in the sidebar**
4. **You should now see real data** from the database!

### Step 3: Test Adding Assets
1. **Click "Add Asset"** button
2. **Fill in the form** (try a computer or laptop category)
3. **Submit** - it should save to the database
4. **Refresh** the page to see your new asset

## 🎯 What This Creates

### Database Tables
- ✅ `assets` - Main assets with 40+ fields for IT equipment
- ✅ `asset_history` - Track all changes (audit trail)
- ✅ `asset_assignments` - Track who has what equipment

### Sample Data (7 Assets)
- ✅ **2 Desktop Computers** (Dell OptiPlex, HP EliteDesk)
- ✅ **2 Laptops** (Dell Latitude, MacBook Air M3)
- ✅ **1 Network Switch** (Cisco Catalyst)
- ✅ **1 CCTV Camera** (Hikvision 4K)
- ✅ **All with realistic specs**: MAC addresses, IP addresses, CPU info, etc.

### Automatic Features
- ✅ **Auto-generated Asset Tags**: ITAMS-AST-0001, ITAMS-AST-0002, etc.
- ✅ **Change Tracking**: Every update is logged
- ✅ **User Permissions**: Inventory staff can manage, others view only
- ✅ **Search & Filter**: Works across all asset fields

## 🔧 If You Still Get Errors

### "Permission Denied" Error
Run this in SQL Editor:
```sql
GRANT ALL ON public.assets TO authenticated;
GRANT ALL ON public.asset_history TO authenticated;  
GRANT ALL ON public.asset_assignments TO authenticated;
```

### "Function not found" Error  
Make sure you ran the complete schema file. The `public.get_auth_user_role()` function should exist from your original seed.sql.

### Dialog Component Error
The dialog component has been updated to use Base UI (which you already have installed) instead of Radix UI.

## 🎉 Success Indicators

You'll know it's working when:
1. ✅ Assets page loads without 404 errors
2. ✅ You see sample assets in the table
3. ✅ Summary cards show correct counts
4. ✅ "Add Asset" button opens the form
5. ✅ You can create new assets successfully

The system is now fully functional with real database storage!