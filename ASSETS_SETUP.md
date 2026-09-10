# IT Assets Management Setup Guide

This guide will help you set up the comprehensive IT Assets Management system with real database functionality.

## 🚀 Quick Setup

### Step 1: Run the Database Schema
1. **Open Supabase Dashboard** and go to your project
2. **Navigate to SQL Editor** (in the left sidebar)
3. **Copy and run the schema file**: `supabase/assets_schema.sql`
   - This creates all necessary tables, triggers, and policies
   - Sets up proper Row Level Security (RLS)
   - Creates automatic asset tag generation

### Step 2: Add Sample Data
1. **In the same SQL Editor**, copy and run: `supabase/sample_assets_data.sql`
   - This adds 30+ realistic IT assets including:
     - Desktop computers with full specs (CPU, RAM, storage)
     - Laptops with MAC addresses and network info
     - CCTV cameras with IP addresses and resolutions
     - Network equipment with port counts and firmware versions
     - Servers, monitors, printers, tablets, UPS systems

### Step 3: Test the Application
1. **Start your React app**: `pnpm dev` (in Command Prompt)
2. **Login as inventory staff**: `inventory.staff@itams.edu` / `Password123!`
3. **Navigate to Assets page** from the sidebar
4. **Test functionality**:
   - View real assets from the database
   - Search and filter assets
   - Click "Add Asset" to create new assets
   - Try different asset categories (computer, laptop, CCTV, networking)

## 🏗️ Database Schema Overview

### Main Tables Created

#### `public.assets`
- **Primary asset information**: name, description, category, brand, model, serial number
- **Financial data**: purchase cost, vendor, warranty information
- **Location tracking**: current location, status, condition
- **IT-specific fields**: 
  - **Computers/Laptops**: computer name, MAC address, IP address, OS, CPU, RAM, storage
  - **CCTV**: camera resolution, type, recording capacity
  - **Networking**: port count, management IP, firmware version
- **General specs**: power consumption, dimensions, weight
- **Assignment tracking**: who is using the asset, when assigned

#### `public.asset_history`
- Tracks all changes to assets (creation, updates, assignments, returns)
- Maintains audit trail of who made changes and when
- Records old and new values for important fields

#### `public.asset_assignments`
- Manages borrowing/allocation of assets to users
- Tracks assignment dates, expected return dates, actual return dates
- Records condition at time of assignment and return
- Includes deployment location and purpose

### Key Features

#### 🔒 Security (Row Level Security)
- **Inventory Staff & ITSD**: Full access to all assets
- **End Users**: Can only view assets assigned to them
- **Proper authentication**: Uses existing user roles from your system

#### 🚀 Automation
- **Auto-generated asset tags**: Format `ITAMS-AST-####` with sequential numbering
- **Change tracking**: Automatic logging of status changes and assignments
- **Timestamp updates**: Automatic `updated_at` field maintenance

#### 🔍 Performance
- **Optimized indexes**: On asset tags, serial numbers, categories, MAC addresses
- **Efficient queries**: Designed for fast searching and filtering

## 📋 Asset Categories Supported

1. **Computer** - Desktop computers with full IT specifications
2. **Laptop** - Portable computers with network and hardware details
3. **Server** - Enterprise servers with advanced specifications
4. **Monitor** - Displays and monitors
5. **Printer/Scanner** - Printing and scanning equipment
6. **Networking** - Switches, routers, access points, firewalls
7. **CCTV** - Security cameras with resolution and recording specs
8. **Phone/Tablet** - Mobile devices and VoIP phones
9. **Projector** - Presentation equipment
10. **UPS** - Uninterruptible power supplies
11. **Storage** - External storage devices
12. **Accessory** - Mice, keyboards, cables, etc.
13. **Software** - Software licenses and applications
14. **Other** - Miscellaneous IT equipment

## 🎯 Sample Data Included

The sample data includes realistic IT assets:

### Computers (3 units)
- Dell OptiPlex 7090 (Faculty Office) - Windows 11 Pro, i7, 16GB RAM
- HP EliteDesk 800 G9 (Admin Building) - Windows 11 Pro, i5, 8GB RAM  
- Apple iMac 24" M3 (Design Studio) - macOS Sonoma, M3, 16GB RAM

### Laptops (3 units)
- Dell Latitude 7440 (Mobile Pool) - Business laptop, i7, 16GB RAM
- Apple MacBook Air M3 15" (Creative Lab) - Creative work, M3, 16GB RAM
- Lenovo ThinkPad P16 Gen 2 (Engineering) - Workstation, i9, 64GB RAM

### CCTV Cameras (3 units)
- Hikvision ColorVu Turret (Main Entrance) - 8MP, 4K, Night Vision
- Axis PTZ Dome (Parking Lot) - Professional PTZ, High Resolution
- Dahua Bullet Camera (Perimeter) - 8MP IP, Perimeter Security

### Network Equipment (3 units)
- Cisco Catalyst 9300 Switch (Core Network) - 48 ports, managed
- Ubiquiti Dream Machine Pro (Gateway) - Enterprise firewall
- Aruba Wi-Fi 6E Access Point (Library) - High-performance wireless

### Additional Equipment
- Servers (Dell PowerEdge, HPE ProLiant)
- Monitors (Dell UltraSharp, LG 4K)
- Printers (HP LaserJet, Canon All-in-One)
- Tablets (iPad Pro, Surface Pro)
- UPS Systems (APC Smart-UPS, CyberPower)

## 🔧 Customization

### Adding New Asset Categories
1. Update the `asset_category` enum in the database
2. Add the new category to the `categoryOptions` in `AddAssetDialog.jsx`
3. Add category-specific fields to the form as needed

### Adding Custom Fields
1. Add new columns to the `assets` table
2. Update the `AddAssetDialog.jsx` form
3. Update the display logic in `AssetsPage.jsx`

### Modifying Asset Tag Format
Edit the `generate_asset_tag()` function in the database to change the format from `ITAMS-AST-####` to your preferred format.

## 🎉 Ready to Use!

After running both SQL files, you'll have a fully functional IT Assets Management system with:
- ✅ Real database storage
- ✅ 30+ sample IT assets
- ✅ Complete asset specifications
- ✅ Search and filtering
- ✅ Add new assets functionality
- ✅ Proper user permissions
- ✅ Audit trails
- ✅ Professional UI

The system is now ready for production use in a real IT environment!