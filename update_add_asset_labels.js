// Script to update AddAssetDialog labels to add red asterisks for required fields
// Run this with: node update_add_asset_labels.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/inventory/AddAssetDialog.jsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define the label updates - all fields are required except notes
const labelUpdates = [
  // Computer specifications
  { from: 'MAC Address</Label>', to: 'MAC Address <span className="text-red-600">*</span></Label>' },
  { from: 'IP Address</Label>', to: 'IP Address <span className="text-red-600">*</span></Label>' },
  { from: 'Operating System</Label>', to: 'Operating System <span className="text-red-600">*</span></Label>' },
  { from: 'Processor</Label>', to: 'Processor <span className="text-red-600">*</span></Label>' },
  { from: 'RAM (GB)</Label>', to: 'RAM (GB) <span className="text-red-600">*</span></Label>' },
  { from: 'Storage (GB)</Label>', to: 'Storage (GB) <span className="text-red-600">*</span></Label>' },
  { from: 'Network Domain</Label>', to: 'Network Domain <span className="text-red-600">*</span></Label>' },
  
  // CCTV specifications  
  { from: 'Resolution</Label>', to: 'Resolution <span className="text-red-600">*</span></Label>' },
  { from: 'Camera Type</Label>', to: 'Camera Type <span className="text-red-600">*</span></Label>' },
  { from: 'Recording Capacity (TB)</Label>', to: 'Recording Capacity (TB) <span className="text-red-600">*</span></Label>' },
  
  // Networking specifications
  { from: 'Port Count</Label>', to: 'Port Count <span className="text-red-600">*</span></Label>' },
  { from: 'Management IP</Label>', to: 'Management IP <span className="text-red-600">*</span></Label>' },
  { from: 'Firmware Version</Label>', to: 'Firmware Version <span className="text-red-600">*</span></Label>' },
  
  // Basic asset info (already has asterisks for some)
  { from: 'Status</Label>', to: 'Status <span className="text-red-600">*</span></Label>' },
  { from: 'Brand</Label>', to: 'Brand <span className="text-red-600">*</span></Label>' },
  { from: 'Model</Label>', to: 'Model <span className="text-red-600">*</span></Label>' },
  { from: 'Serial Number</Label>', to: 'Serial Number <span className="text-red-600">*</span></Label>' },
  { from: 'Description</Label>', to: 'Description <span className="text-red-600">*</span></Label>' },
  
  // Purchase info
  { from: 'Purchase Date</Label>', to: 'Purchase Date <span className="text-red-600">*</span></Label>' },
  { from: 'Purchase Cost (₱)</Label>', to: 'Purchase Cost (₱) <span className="text-red-600">*</span></Label>' },
  { from: 'Vendor</Label>', to: 'Vendor <span className="text-red-600">*</span></Label>' },
  { from: 'Invoice Number</Label>', to: 'Invoice Number <span className="text-red-600">*</span></Label>' },
  
  // Warranty info
  { from: 'Warranty Start Date</Label>', to: 'Warranty Start Date <span className="text-red-600">*</span></Label>' },
  { from: 'Warranty End Date</Label>', to: 'Warranty End Date <span className="text-red-600">*</span></Label>' },
  { from: 'Warranty Provider</Label>', to: 'Warranty Provider <span className="text-red-600">*</span></Label>' },
  { from: 'Warranty Type</Label>', to: 'Warranty Type <span className="text-red-600">*</span></Label>' },
  
  // Notes should be optional
  { from: 'Notes</Label>', to: 'Notes <span className="text-gray-500">(Optional)</span></Label>' }
];

// Apply updates
labelUpdates.forEach(update => {
  // Only update if it doesn't already have the asterisk/optional marker
  if (content.includes(update.from) && !content.includes(update.to)) {
    content = content.replace(new RegExp(update.from, 'g'), update.to);
  }
});

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ AddAssetDialog labels updated successfully!');
console.log('📝 All fields now have red asterisks (*) except Notes which shows (Optional)');