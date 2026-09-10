import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import {
  Search,
  Loader2,
  X,
  Package,
  UserCheck,
  Wrench,
  ArrowRight,
  Laptop,
  QrCode
} from "lucide-react"
import { ScanAssetDialog } from "@/components/inventory/ScanAssetDialog"

export function GlobalInventorySearch() {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isScanOpen, setIsScanOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState({
    assets: [],
    assignments: [],
    borrowing: [],
    repairs: []
  })

  const navigate = useNavigate()
  const searchContainerRef = useRef(null)
  const inputRef = useRef(null)

  // Global keyboard shortcut: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      } else if (e.key === "Escape") {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search across inventory tables
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults({ assets: [], assignments: [], borrowing: [], repairs: [] })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const [assetsRes, assignmentsRes, borrowingRes, repairsRes] = await Promise.allSettled([
          // 1. Search Assets
          supabase
            .from("assets")
            .select("id, asset_tag, name, category, brand, model, status, location")
            .or(`name.ilike.%${trimmed}%,asset_tag.ilike.%${trimmed}%,brand.ilike.%${trimmed}%,model.ilike.%${trimmed}%,serial_number.ilike.%${trimmed}%,location.ilike.%${trimmed}%`)
            .limit(5),

          // 2. Search Assignments
          supabase
            .from("asset_assignments")
            .select(`
              id,
              asset_id,
              assignee_name,
              assignee_department,
              status,
              purpose,
              assets ( asset_tag, name )
            `)
            .or(`assignee_name.ilike.%${trimmed}%,assignee_department.ilike.%${trimmed}%,purpose.ilike.%${trimmed}%`)
            .limit(3),

          // 3. Search Borrowing
          supabase
            .from("asset_borrowing")
            .select(`
              id,
              asset_id,
              borrower_name,
              borrower_department,
              status,
              purpose,
              assets ( asset_tag, name )
            `)
            .or(`borrower_name.ilike.%${trimmed}%,borrower_department.ilike.%${trimmed}%,purpose.ilike.%${trimmed}%`)
            .limit(3),

          // 4. Search Repairs
          supabase
            .from("asset_repairs")
            .select(`
              id,
              asset_id,
              repair_ticket,
              issue_description,
              status,
              priority,
              assigned_technician,
              assets ( asset_tag, name )
            `)
            .or(`repair_ticket.ilike.%${trimmed}%,issue_description.ilike.%${trimmed}%,assigned_technician.ilike.%${trimmed}%`)
            .limit(3)
        ])

        setResults({
          assets: assetsRes.status === "fulfilled" && assetsRes.value.data ? assetsRes.value.data : [],
          assignments: assignmentsRes.status === "fulfilled" && assignmentsRes.value.data ? assignmentsRes.value.data : [],
          borrowing: borrowingRes.status === "fulfilled" && borrowingRes.value.data ? borrowingRes.value.data : [],
          repairs: repairsRes.status === "fulfilled" && repairsRes.value.data ? repairsRes.value.data : []
        })
      } catch (err) {
        console.error("Global search error:", err)
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const totalResultsCount =
    results.assets.length +
    results.assignments.length +
    results.borrowing.length +
    results.repairs.length

  const handleSelectAsset = (asset) => {
    setIsOpen(false)
    navigate(`/dashboard/inventory/assets?search=${encodeURIComponent(asset.asset_tag || asset.name)}`)
  }

  const handleSelectAssignment = (item) => {
    setIsOpen(false)
    const term = item.assets?.asset_tag || item.assignee_name || ""
    navigate(`/dashboard/inventory/borrowed-return?search=${encodeURIComponent(term)}`)
  }

  const handleSelectBorrowing = (item) => {
    setIsOpen(false)
    const term = item.assets?.asset_tag || item.borrower_name || ""
    navigate(`/dashboard/inventory/borrowed-return?search=${encodeURIComponent(term)}`)
  }

  const handleSelectRepair = (repair) => {
    setIsOpen(false)
    navigate(`/dashboard/inventory/repairs?search=${encodeURIComponent(repair.repair_ticket)}`)
  }

  const handleSearchAll = (targetPath) => {
    setIsOpen(false)
    navigate(`${targetPath}?search=${encodeURIComponent(query.trim())}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      handleSearchAll("/dashboard/inventory/assets")
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "in_stock":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
      case "deployed":
      case "allocated":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
      case "in_progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
      case "completed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
    }
  }

  return (
    <div ref={searchContainerRef} className="relative">
      {/* Search Input Box */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-[5px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-xs text-muted-foreground focus-within:ring-2 focus-within:ring-red-600/30 focus-within:border-red-600/60 transition-all">
        {isLoading ? (
          <Loader2 className="size-3.5 text-red-600 animate-spin" />
        ) : (
          <Search className="size-3.5 text-muted-foreground" />
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search assets, tags, borrowers..."
          className="bg-transparent text-xs text-foreground outline-none w-36 sm:w-48 md:w-64 placeholder:text-muted-foreground/70"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setResults({ assets: [], assignments: [], borrowing: [], repairs: [] })
              inputRef.current?.focus()
            }}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
            title="Clear search"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsScanOpen(true)}
              className="p-1 rounded text-zinc-500 hover:text-red-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Scan Asset QR Code"
            >
              <QrCode className="size-3.5" />
            </button>
            <kbd className="hidden sm:inline-flex text-[10px] bg-white dark:bg-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-600 font-mono text-zinc-500">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* Camera Scan Dialog */}
      <ScanAssetDialog
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onScanSuccess={(scannedTag) => {
          setIsScanOpen(false)
          setQuery(scannedTag)
          navigate(`/dashboard/inventory/assets?search=${encodeURIComponent(scannedTag)}`)
        }}
      />

      {/* Search Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full mt-2 right-0 w-[340px] sm:w-[460px] max-h-[500px] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[8px] shadow-2xl z-50 divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header Summary */}
          <div className="p-3 bg-zinc-50/70 dark:bg-zinc-800/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isLoading ? (
                "Searching inventory..."
              ) : (
                <>Found <strong className="text-foreground font-semibold">{totalResultsCount}</strong> results for &ldquo;{query}&rdquo;</>
              )}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">ESC to close</span>
          </div>

          {/* If No Results */}
          {!isLoading && totalResultsCount === 0 && (
            <div className="p-6 text-center">
              <Package className="size-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No matching inventory records</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for another asset tag, model, serial, or borrower name.
              </p>
            </div>
          )}

          {/* Section: Assets */}
          {results.assets.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-[10px] font-bold tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
                <Package className="size-3 text-red-600" />
                Assets ({results.assets.length})
              </div>
              <div className="space-y-1">
                {results.assets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleSelectAsset(asset)}
                    className="w-full text-left p-2 rounded-[6px] hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 shrink-0">
                        <Laptop className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground truncate">
                            {asset.asset_tag}
                          </span>
                          <span className="text-xs font-medium text-foreground truncate">
                            {asset.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {asset.brand} {asset.model} • {asset.location || "No location"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${getStatusBadge(asset.status)}`}>
                        {asset.status?.replace("_", " ")}
                      </span>
                      <ArrowRight className="size-3.5 text-zinc-400 group-hover:text-red-600 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Assignments & Borrowing */}
          {(results.assignments.length > 0 || results.borrowing.length > 0) && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-[10px] font-bold tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
                <UserCheck className="size-3 text-blue-600" />
                Assigned & Borrowed Records
              </div>
              <div className="space-y-1">
                {/* Permanent Assignments */}
                {results.assignments.map((assignment) => (
                  <button
                    key={`assign-${assignment.id}`}
                    type="button"
                    onClick={() => handleSelectAssignment(assignment)}
                    className="w-full text-left p-2 rounded-[6px] hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {assignment.assignee_name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          Assigned
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {assignment.assets?.asset_tag || "Asset"} ({assignment.assets?.name || "Equipment"}) • {assignment.assignee_department}
                      </p>
                    </div>
                    <ArrowRight className="size-3.5 text-zinc-400 group-hover:text-blue-600 shrink-0 transition-colors" />
                  </button>
                ))}

                {/* Short-Term Borrowing */}
                {results.borrowing.map((borrow) => (
                  <button
                    key={`borrow-${borrow.id}`}
                    type="button"
                    onClick={() => handleSelectBorrowing(borrow)}
                    className="w-full text-left p-2 rounded-[6px] hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {borrow.borrower_name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Borrowed
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {borrow.assets?.asset_tag || "Asset"} ({borrow.assets?.name || "Equipment"}) • {borrow.borrower_department}
                      </p>
                    </div>
                    <ArrowRight className="size-3.5 text-zinc-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Repairs */}
          {results.repairs.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-[10px] font-bold tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
                <Wrench className="size-3 text-purple-600" />
                Repairs ({results.repairs.length})
              </div>
              <div className="space-y-1">
                {results.repairs.map((repair) => (
                  <button
                    key={repair.id}
                    type="button"
                    onClick={() => handleSelectRepair(repair)}
                    className="w-full text-left p-2 rounded-[6px] hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {repair.repair_ticket}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                          repair.priority === "urgent" || repair.priority === "high"
                            ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}>
                          {repair.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {repair.issue_description} • {repair.assets?.name || "Asset"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${getStatusBadge(repair.status)}`}>
                        {repair.status?.replace("_", " ")}
                      </span>
                      <ArrowRight className="size-3.5 text-zinc-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Quick Links */}
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 text-[11px] flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-zinc-500">Go to page:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSearchAll("/dashboard/inventory/assets")}
                className="px-2 py-1 rounded bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600 font-medium text-foreground cursor-pointer transition-colors"
              >
                Assets
              </button>
              <button
                type="button"
                onClick={() => handleSearchAll("/dashboard/inventory/borrowed-return")}
                className="px-2 py-1 rounded bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600 font-medium text-foreground cursor-pointer transition-colors"
              >
                Borrowed
              </button>
              <button
                type="button"
                onClick={() => handleSearchAll("/dashboard/inventory/repairs")}
                className="px-2 py-1 rounded bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600 font-medium text-foreground cursor-pointer transition-colors"
              >
                Repairs
              </button>
              <button
                type="button"
                onClick={() => handleSearchAll("/dashboard/inventory/warranty")}
                className="px-2 py-1 rounded bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600 font-medium text-foreground cursor-pointer transition-colors"
              >
                Warranty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GlobalInventorySearch
