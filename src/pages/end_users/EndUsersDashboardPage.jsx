import React, { useState, useEffect } from "react"
import { EndUsersLayout } from "@/layouts/end_users/EndUsersLayout"
import { useAuth } from "@/hooks/useAuth"
import { AssetsDirectoryView } from "@/components/end_users/AssetsDirectoryView"
import { supabase } from "@/lib/supabaseClient"
import {
  Laptop,
  Monitor,
  MousePointer,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function EndUsersDashboardPage() {
  const { profile, user } = useAuth()
  const [activeTab, setActiveTab] = useState("equipment")
  const [myAssignedDevices, setMyAssignedDevices] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const roleDetails = profile?.roleDetails

  // Fetch user's assigned assets
  const fetchAssignedAssets = async () => {
    if (!user?.email) return

    try {
      setIsLoading(true)
      
      // Query asset assignments for current user
      const { data: assignments, error } = await supabase
        .from('asset_assignments')
        .select(`
          id,
          asset_id,
          assigned_date,
          assignment_location,
          status,
          assets (
            asset_tag,
            name,
            serial_number,
            category,
            condition,
            status
          )
        `)
        .eq('assignee_email', user.email)
        .eq('status', 'active')
        .order('assigned_date', { ascending: false })

      if (error) {
        console.error('Error fetching assigned assets:', error)
        return
      }

      // Format the data for display
      const formattedDevices = assignments?.map(assignment => ({
        tag: assignment.assets?.asset_tag || 'N/A',
        serial: assignment.assets?.serial_number || 'N/A',
        device: assignment.assets?.name || 'Unknown Device',
        category: assignment.assets?.category || 'Unknown',
        dateIssued: assignment.assigned_date ? 
          new Date(assignment.assigned_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A',
        condition: assignment.assets?.condition || 'Unknown',
        status: 'In Custody',
      })) || []

      setMyAssignedDevices(formattedDevices)
    } catch (error) {
      console.error('Error fetching assigned assets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignedAssets()
  }, [user?.email])

  const userMetrics = [
    { 
      label: "Assigned Devices", 
      value: `${myAssignedDevices.length} Units`, 
      change: "In active custody", 
      icon: Laptop 
    },
    { label: "Support Requests", value: "1 Active", change: "ITSD responding", icon: Clock },
    { label: "Device Compliance", value: "100%", change: "Encrypted & Compliant", icon: ShieldCheck },
    { label: "Software Licenses", value: "5 Active", change: "Office 365, Adobe CC", icon: CheckCircle2 },
  ]

  return (
    <EndUsersLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-4">
        {activeTab === "assets" ? (
          // Assets Directory View
          <>
            {/* Top Hero Banner for Assets */}
            <div className="rounded-[5px] bg-gradient-to-r from-red-900 via-red-800 to-zinc-900 text-white p-4 sm:p-5 shadow-md relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] text-xs font-semibold bg-white/15 backdrop-blur-xs text-red-100">
                  <Laptop className="size-3.5" />
                  Asset Directory
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Assets & Equipment Directory
                </h2>
                <p className="text-xs sm:text-sm text-red-100/80 leading-relaxed">
                  Browse and search all assets in the IT inventory. View specifications, availability status, and location details for planning and reference purposes.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
                <Monitor className="size-72" />
              </div>
            </div>

            <AssetsDirectoryView />
          </>
        ) : (
          // Default Equipment Dashboard
          <>
            {/* Top Hero Banner */}
            <div className="rounded-[5px] bg-gradient-to-r from-red-900 via-red-800 to-zinc-900 text-white p-4 sm:p-5 shadow-md relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] text-xs font-semibold bg-white/15 backdrop-blur-xs text-red-100">
                  <CheckCircle2 className="size-3.5" />
                  Department: {roleDetails?.department || "Academic Affairs"}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  My IT Assets & Workspace Portal
                </h2>
                <p className="text-xs sm:text-sm text-red-100/80 leading-relaxed">
                  Assigned Office: <span className="font-semibold text-white">{roleDetails?.office_location || "Faculty Hall - Room 302"}</span> • Custody Status: <span className="font-semibold text-white">Verified & Compliant</span>. View your active equipment, request peripherals, or file repair tickets.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
                <Laptop className="size-72" />
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {userMetrics.map((metric, i) => {
                const Icon = metric.icon
                return (
                  <Card key={i} variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
                    <CardContent className="p-3.5 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                        <p className="text-xl font-extrabold text-foreground">{metric.value}</p>
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{metric.change}</p>
                      </div>
                      <div className="size-9 rounded-[5px] bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 flex items-center justify-center">
                        <Icon className="size-4.5" />
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                    {isLoading ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-8 text-center text-muted-foreground">
                          Loading assigned devices...
                        </td>
                      </tr>
                    ) : myAssignedDevices.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-8 text-center text-muted-foreground">
                          No devices currently assigned to you.
                        </td>
                      </tr>
                    ) : (
                      myAssignedDevices.map((device, index) => (
                        <tr key={device.tag || index} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-semibold text-foreground">{device.tag}</td>
                          <td className="px-5 py-3.5 font-medium text-foreground">{device.device}</td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-500">{device.serial}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{device.dateIssued}</td>
                          <td className="px-5 py-3.5 text-foreground">{device.condition}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                              {device.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </EndUsersLayout>
  )
}

export default EndUsersDashboardPage
