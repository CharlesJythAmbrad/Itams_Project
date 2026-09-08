import React, { useState } from "react"
import { EndUsersLayout } from "@/layouts/end_users/EndUsersLayout"
import { useAuth } from "@/hooks/useAuth"
import {
  Laptop,
  Monitor,
  MousePointer,
  CheckCircle2,
  Clock,
  Plus,
  Wrench,
  FileText,
  ShieldCheck,
  RotateCcw,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function EndUsersDashboardPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState("equipment")
  const roleDetails = profile?.roleDetails

  const userMetrics = [
    { label: "Assigned Devices", value: "3 Units", change: "In active custody", icon: Laptop },
    { label: "Support Requests", value: "1 Active", change: "ITSD responding", icon: Clock },
    { label: "Device Compliance", value: "100%", change: "Encrypted & Compliant", icon: ShieldCheck },
    { label: "Software Licenses", value: "5 Active", change: "Office 365, Adobe CC", icon: CheckCircle2 },
  ]

  const myAssignedDevices = [
    {
      tag: "ITAMS-AST-0101",
      serial: "SN-9021884",
      device: "Apple MacBook Pro 16-inch M3 Pro",
      category: "Laptop",
      dateIssued: "Jan 12, 2026",
      condition: "Excellent",
      status: "In Custody",
    },
    {
      tag: "ITAMS-AST-0102",
      serial: "SN-9021885",
      device: "Dell UltraSharp U2723QE 4K USB-C Hub Monitor",
      category: "Display",
      dateIssued: "Jan 12, 2026",
      condition: "Good",
      status: "In Custody",
    },
    {
      tag: "ITAMS-AST-0106",
      serial: "SN-6102941",
      device: "Logitech MX Master 3S Wireless Mouse",
      category: "Accessory",
      dateIssued: "Feb 01, 2026",
      condition: "Good",
      status: "In Custody",
    },
  ]

  return (
    <EndUsersLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-6">
        {/* Top Hero Banner */}
        <div className="rounded-[5px] bg-gradient-to-r from-emerald-900 via-teal-900 to-zinc-900 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] text-xs font-semibold bg-white/15 backdrop-blur-xs text-emerald-100">
              <CheckCircle2 className="size-3.5" />
              Department: {roleDetails?.department || "Academic Affairs"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              My IT Assets & Workspace Portal
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Assigned Office: <span className="font-semibold text-white">{roleDetails?.office_location || "Faculty Hall - Room 302"}</span> • Custody Status: <span className="font-semibold text-white">Verified & Compliant</span>. View your active equipment, request peripherals, or file repair tickets.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
            <Laptop className="size-72" />
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {userMetrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <Card key={i} variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                    <p className="text-xl font-extrabold text-foreground">{metric.value}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{metric.change}</p>
                  </div>
                  <div className="size-11 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <Icon className="size-5.5" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Assigned Hardware Table */}
        <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
          <div className="p-5 sm:p-6 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">My Assigned Equipment</h3>
              <p className="text-xs text-muted-foreground">Assets currently registered under your custody</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-[5px] text-xs gap-1.5">
                <FileText className="size-3.5" />
                Custody Slip
              </Button>
              <Button variant="brand" size="sm" className="rounded-[5px] text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800">
                <Plus className="size-3.5" />
                Request Peripheral
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Asset Tag</th>
                  <th className="px-5 py-3">Device Name</th>
                  <th className="px-5 py-3">Serial Number</th>
                  <th className="px-5 py-3">Date Issued</th>
                  <th className="px-5 py-3">Condition</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                {myAssignedDevices.map((device) => (
                  <tr key={device.tag} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-foreground">{device.tag}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{device.device}</td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-500">{device.serial}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{device.dateIssued}</td>
                    <td className="px-5 py-3.5 text-foreground">{device.condition}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {device.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      <button
                        type="button"
                        className="p-1 rounded text-zinc-500 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        title="Report Hardware Issue"
                      >
                        <Wrench className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded text-zinc-500 hover:text-amber-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        title="Initiate Return"
                      >
                        <RotateCcw className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </EndUsersLayout>
  )
}

export default EndUsersDashboardPage
