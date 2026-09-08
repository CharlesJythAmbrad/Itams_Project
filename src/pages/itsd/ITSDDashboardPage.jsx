import React, { useState } from "react"
import { ITSDLayout } from "@/layouts/itsd/ITSDLayout"
import { useAuth } from "@/hooks/useAuth"
import {
  Laptop,
  Server,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Plus,
  Database,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ITSDDashboardPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const roleDetails = profile?.roleDetails

  const fleetMetrics = [
    { label: "Active Nodes", value: "1,482", change: "+14 this week", icon: Laptop },
    { label: "Server Availability", value: "99.95%", change: "48 clusters online", icon: Server },
    { label: "Security Vault", value: "Zero Trust", change: "3 audited regions", icon: ShieldCheck },
    { label: "System Incidents", value: "2 Open", change: "All within SLA", icon: AlertTriangle },
  ]

  const recentNodes = [
    { id: "NODE-8821", name: "Dell Precision 5860 Workstation", ip: "192.168.10.45", user: "Dr. Angela Reyes", status: "Active", health: "98%" },
    { id: "NODE-8822", name: "Apple MacBook Pro M3 Max", ip: "192.168.10.52", user: "Prof. Kenneth David", status: "Active", health: "100%" },
    { id: "NODE-8823", name: "HP ZBook Fury 16 G10", ip: "192.168.10.89", user: "Sarah Chen (Inventory)", status: "Active", health: "94%" },
    { id: "NODE-8824", name: "Lenovo ThinkStation P620", ip: "192.168.10.104", user: "Dr. Vincent Yu", status: "Maintenance", health: "78%" },
  ]

  return (
    <ITSDLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-6">
        {/* Top ITSD Hero Banner */}
        <div className="rounded-[5px] bg-gradient-to-r from-red-900 via-red-800 to-zinc-900 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] text-xs font-semibold bg-white/15 backdrop-blur-xs text-red-100">
              <Activity className="size-3.5" />
              Tier: {roleDetails?.admin_level || "Lead ITSD Administrator"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              IT Systems Desk & Infrastructure Console
            </h2>
            <p className="text-xs sm:text-sm text-red-100/80 leading-relaxed">
              Specialization: <span className="font-semibold text-white">{roleDetails?.specialization || "Enterprise Infrastructure"}</span> • Shift: <span className="font-semibold text-white">{roleDetails?.shift || "Day Shift"}</span>. Full administrative custody over server nodes and workstation fleets.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
            <Database className="size-72" />
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fleetMetrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <Card key={i} variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                    <p className="text-xl font-extrabold text-foreground">{metric.value}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{metric.change}</p>
                  </div>
                  <div className="size-11 rounded-[5px] bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 flex items-center justify-center">
                    <Icon className="size-5.5" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Active Workstation Nodes Ledger */}
        <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
          <div className="p-5 sm:p-6 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">Fleet Telemetry & Active Hardware Nodes</h3>
              <p className="text-xs text-muted-foreground">Real-time status of assigned enterprise workstations</p>
            </div>
            <div className="flex gap-2">
              <Button variant="brand" size="sm" className="rounded-[5px] text-xs gap-1.5">
                <Plus className="size-3.5" />
                Provision Node
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Node Tag</th>
                  <th className="px-5 py-3">Device Model</th>
                  <th className="px-5 py-3">Assigned User</th>
                  <th className="px-5 py-3">IP Address</th>
                  <th className="px-5 py-3">Hardware Health</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                {recentNodes.map((node) => (
                  <tr key={node.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-foreground">{node.id}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{node.name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{node.user}</td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-500">{node.ip}</td>
                    <td className="px-5 py-3.5 font-semibold text-foreground">{node.health}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${
                        node.status === "Active"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}>
                        {node.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </ITSDLayout>
  )
}

export default ITSDDashboardPage
