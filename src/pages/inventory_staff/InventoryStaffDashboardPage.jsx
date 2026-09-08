import React, { useState } from "react"
import { InventoryStaffLayout } from "@/layouts/inventory_staff/InventoryStaffLayout"
import { useAuth } from "@/hooks/useAuth"
import {
  Package,
  QrCode,
  HardDrive,
  UserCheck,
  Plus,
  Boxes,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function InventoryStaffDashboardPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState("stock")
  const roleDetails = profile?.roleDetails

  const inventoryMetrics = [
    { label: "Warehouse Bay Items", value: "4,820", change: "98% audit verified", icon: Package },
    { label: "Scanned This Week", value: "340", change: "QR & Barcode verified", icon: QrCode },
    { label: "Pending Handover", value: "14 Units", change: "Ready for delivery", icon: UserCheck },
    { label: "Servicing / RMA", value: "4 Units", change: "Under warranty repair", icon: HardDrive },
  ]

  const warehouseInventory = [
    { tag: "ITAMS-AST-0101", serial: "SN-9021884", item: "Apple MacBook Air M3 15-inch", bay: "Bay 4 - Rack A1", category: "Laptop", status: "In Stock" },
    { tag: "ITAMS-AST-0102", serial: "SN-9021885", item: "Dell UltraSharp U2723QE 4K Monitor", bay: "Bay 4 - Rack B2", category: "Display", status: "In Stock" },
    { tag: "ITAMS-AST-0103", serial: "SN-7718290", item: "Lenovo ThinkPad P16 Gen 2", bay: "Bay 4 - Checkout", category: "Workstation", status: "Allocated" },
    { tag: "ITAMS-AST-0104", serial: "SN-4412998", item: "Cisco Catalyst 9200 48-Port Switch", bay: "Bay 2 - Comms Depot", category: "Networking", status: "In Stock" },
    { tag: "ITAMS-AST-0105", serial: "SN-3391002", item: "Zebra ZD421 Direct Thermal Printer", bay: "Bay 4 - Rack D1", category: "Peripheral", status: "Maintenance" },
    { tag: "ITAMS-AST-0106", serial: "SN-6102941", item: "Logitech MX Master 3S Wireless Mouse", bay: "Bay 4 - Bin 12", category: "Accessory", status: "In Stock" },
  ]

  return (
    <InventoryStaffLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-6">
        {/* Top Inventory Hero Banner */}
        <div className="rounded-[5px] bg-gradient-to-r from-blue-900 via-indigo-900 to-zinc-900 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] text-xs font-semibold bg-white/15 backdrop-blur-xs text-blue-100">
              <Boxes className="size-3.5" />
              Badge: {roleDetails?.badge_number || "INV-0042"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Asset Custody & Warehouse Operations Console
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
              Location: <span className="font-semibold text-white">{roleDetails?.warehouse_location || "Central IT Warehouse - Bay 4"}</span> • Role: <span className="font-semibold text-white">{roleDetails?.inventory_tier || "Lead Hardware Custodian"}</span>. Manage asset allocations, QR scanning, and stock audit trails.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
            <Package className="size-72" />
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {inventoryMetrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <Card key={i} variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                    <p className="text-xl font-extrabold text-foreground">{metric.value}</p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">{metric.change}</p>
                  </div>
                  <div className="size-11 rounded-[5px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                    <Icon className="size-5.5" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Warehouse Bay Ledger */}
        <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
          <div className="p-5 sm:p-6 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">Stock Ledger & Bay Storage</h3>
              <p className="text-xs text-muted-foreground">Real-time inventory locations across warehouse zones</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-[5px] text-xs gap-1.5">
                <QrCode className="size-3.5" />
                Scan QR Tag
              </Button>
              <Button variant="brand" size="sm" className="rounded-[5px] text-xs gap-1.5 bg-blue-700 hover:bg-blue-800">
                <Plus className="size-3.5" />
                Check-in Asset
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Asset Tag</th>
                  <th className="px-5 py-3">Item Description</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Serial Number</th>
                  <th className="px-5 py-3">Warehouse Bay</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                {warehouseInventory.map((item) => (
                  <tr key={item.tag} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-foreground">{item.tag}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{item.item}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{item.category}</td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-500">{item.serial}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{item.bay}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${
                        item.status === "In Stock"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : item.status === "Allocated"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </InventoryStaffLayout>
  )
}

export default InventoryStaffDashboardPage
