# 🚀 Database Setup Instructions

## STEP 1: Run the Database Script

1. **Open your Supabase Dashboard**: Go to https://supabase.com/dashboard
2. **Navigate to your project**: Click on your project
3. **Go to SQL Editor**: Click "SQL Editor" in the left sidebar
4. **Copy the entire contents** of the file `run_this_in_supabase.sql`
5. **Paste it into the SQL Editor**
6. **Click "RUN" button**

## STEP 2: Verify the Setup

After running the script, you should see success messages showing:
- ✅ Total assets created
- ✅ Asset categories breakdown
- ✅ Setup completion confirmation

## STEP 3: Test Your Application

1. **Start your React app**: Run `pnpm dev` in your terminal
2. **Login as inventory staff**: Use `inventory.staff@itams.edu` / `Password123!`
3. **Go to Assets page**: Click "Assets" in the sidebar
4. **You should see**: Sample assets loaded from the database

## STEP 4: Test the Add Asset Form

1. **Click "Add Asset" button** on the Assets page
2. **Fill out the form** with test data:
   - **Name**: Test Computer
   - **Category**: Desktop Computer
   - **Location**: Test Lab
   - **Brand**: Dell (optional)
   - **Model**: Test Model (optional)
3. **Click "Add Asset"**
4. **The form should close** and the new asset should appear in the list

## 🔥 What This Setup Creates

### Database Tables
- **`assets`** - Main assets table with all IT equipment fields
- Auto-generated asset tags (ITAMS-AST-0001, ITAMS-AST-0002, etc.)
- Proper security policies for your user roles

### Sample Data (15+ Assets)
- Desktop computers with full specs
- Laptops (Dell, Apple, Lenovo)
- Network equipment (Cisco switches, Ubiquiti routers)
- CCTV cameras with IP addresses
- Monitors, printers, tablets, UPS systems

### Features Ready to Use
- ✅ Search and filter assets
- ✅ Add new assets with category-specific fields
- ✅ View detailed asset specifications
- ✅ Proper user permissions
- ✅ Asset status tracking
- ✅ Warranty information

## 🆘 Troubleshooting

**If you get "table does not exist" errors:**
- Make sure you ran the entire SQL script
- Check that you're logged into the correct Supabase project
- Verify your `.env` file has the correct Supabase URL and key

**If the Add Asset form doesn't work:**
- Check the browser console for errors
- Make sure you're logged in as an authenticated user
- Verify the database policies were created correctly

## 🎉 Success!

Once setup is complete, you'll have a fully functional IT Asset Management system ready for production use!