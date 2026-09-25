import React, { useState, useEffect } from "react"
import { ITSDLayout } from "@/layouts/itsd/ITSDLayout"
import { supabase } from "@/lib/supabaseClient"
import { createClient } from "@supabase/supabase-js"
import { useAuth } from "@/hooks/useAuth"
import {
  Users,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Package,
  Laptop,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  Activity,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Building,
  Warehouse,
  Briefcase
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function UserManagementPage() {
  const { user: currentAdminUser } = useAuth()
  const [activeTab, setActiveTab] = useState("user-management")
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState("")

  // Add User Form State (based on seed.sql role definitions)
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "end_user",
    department: "Medical Faculty & Operations",
    job_title: "Clinical Staff",
    warehouse_location: "Central IT Warehouse - Bay 4",
    inventory_tier: "Stock Custodian",
    admin_level: "Tier 2 Support",
    specialization: "Enterprise IT & Hardware Infrastructure"
  })
  const [showPassword, setShowPassword] = useState(false)

  // Role configurations for display (based on seed.sql user_role enum)
  const roleConfig = {
    itsd: {
      name: "ITSD Admin",
      icon: Shield,
      color: "red",
      description: "Full system administrator privileges"
    },
    inventory_staff: {
      name: "IT Specialist",
      icon: Package,
      color: "blue",
      description: "Asset and inventory custody"
    },
    end_user: {
      name: "End User",
      icon: Laptop,
      color: "green",
      description: "General staff and asset requester"
    }
  }

  // Statistics
  const userStats = {
    total: users.length,
    active: users.filter(u => u.is_deactivated !== true).length,
    inactive: users.filter(u => u.is_deactivated === true).length,
    itsd: users.filter(u => u.role === 'itsd').length,
    inventory_staff: users.filter(u => u.role === 'inventory_staff').length,
    end_user: users.filter(u => u.role === 'end_user').length
  }

  // Fetch users directly from public.users with joined role tables
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Fetch users with their dedicated role details - handle missing is_deactivated column
      let publicUsers = null
      let publicError = null

      // Try with is_deactivated column first
      const { data: usersWithStatus, error: statusError } = await supabase
        .from("users")
        .select(`
          id,
          email,
          full_name,
          role,
          is_deactivated,
          last_login_at,
          created_at,
          updated_at,
          itsd_users ( admin_level, specialization, shift ),
          inventory_staff_users ( warehouse_location, inventory_tier, badge_number ),
          end_users ( department, employee_id, job_title )
        `)
        .order("created_at", { ascending: false })

      if (statusError && statusError.message?.includes('is_deactivated')) {
        console.warn("Column is_deactivated doesn't exist, falling back to basic query:", statusError.message)
        // Fallback query without is_deactivated
        const { data: basicUsers, error: basicError } = await supabase
          .from("users")
          .select(`
            id,
            email,
            full_name,
            role,
            last_login_at,
            created_at,
            updated_at,
            itsd_users ( admin_level, specialization, shift ),
            inventory_staff_users ( warehouse_location, inventory_tier, badge_number ),
            end_users ( department, employee_id, job_title )
          `)
          .order("created_at", { ascending: false })
        
        if (basicError) {
          console.warn("Falling back to flat query for public.users:", basicError.message)
          const fallback = await supabase
            .from("users")
            .select("*")
            .order("created_at", { ascending: false })

          if (fallback.error) throw fallback.error
          publicUsers = fallback.data
        } else {
          publicUsers = basicUsers
        }
      } else if (statusError) {
        console.warn("Falling back to flat query for public.users:", statusError.message)
        const fallback = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false })

        if (fallback.error) throw fallback.error
        publicUsers = fallback.data
      } else {
        publicUsers = usersWithStatus
      }

      setUsers(publicUsers || [])
    } catch (err) {
      console.error("Error fetching users:", err)
      setError(`Failed to load users: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter users based on search and dropdown filters
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.role?.toLowerCase().includes(q)
      )
    }

    // Status filter (handle missing is_deactivated column)
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(user => user.is_deactivated !== true)
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(user => user.is_deactivated === true)
      }
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchQuery, statusFilter, roleFilter])

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Handle user activation/deactivation - handle missing is_deactivated column gracefully
  const handleToggleUserStatus = async (userId, currentStatus, userName) => {
    if (userId === currentAdminUser?.id) {
      setError("You cannot deactivate your own administrator account.")
      setTimeout(() => setError(""), 5000)
      return
    }

    setActionLoadingId(userId)
    setError("")
    setSuccessMessage("")

    try {
      const newStatus = !currentStatus

      // Always try to update is_deactivated - this will help us detect if the column exists
      const { error: updateError } = await supabase
        .from("users")
        .update({
          is_deactivated: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId)

      if (updateError) {
        console.error("Database update error:", updateError)
        
        // Check for specific column missing error
        if (updateError.message?.includes('column "is_deactivated" of relation "users" does not exist') || 
            updateError.message?.includes('is_deactivated')) {
          setError("User management system is not properly set up. The database is missing required columns. Please contact your system administrator to run the migration script.")
          return
        }
        
        // Check for permission errors
        if (updateError.message?.includes('permission') || updateError.message?.includes('RLS')) {
          setError("You don't have permission to update user status. Please check your administrator privileges.")
          return
        }
        
        // Other database errors
        throw new Error(`Database error: ${updateError.message}`)
      }

      // Verify the update actually worked by refetching the user
      const { data: verifyUser, error: verifyError } = await supabase
        .from("users")
        .select("is_deactivated")
        .eq("id", userId)
        .maybeSingle()

      if (verifyError) {
        console.warn("Could not verify update:", verifyError.message)
      }

      // Check if the update actually took effect
      if (verifyUser && verifyUser.is_deactivated !== newStatus) {
        setError("Update appeared successful but database value didn't change. This may be a permissions issue or database constraint.")
        return
      }

      // Optimistically update local users list
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, is_deactivated: newStatus, updated_at: new Date().toISOString() }
          : user
      ))

      setSuccessMessage(`User "${userName || 'Account'}" has been ${newStatus ? 'deactivated' : 'activated'} successfully.`)
      setTimeout(() => setSuccessMessage(""), 5000)

    } catch (err) {
      console.error("Error updating user status:", err)
      setError(`Failed to update user status: ${err.message}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Handle add new user
  const handleAddUser = async (e) => {
    e.preventDefault()
    setModalError("")

    if (!newUserData.email.trim() || !newUserData.password || !newUserData.full_name.trim() || !newUserData.role) {
      setModalError("Please fill out all required fields marked with *.")
      return
    }

    if (newUserData.password.length < 6) {
      setModalError("Password must be at least 6 characters long.")
      return
    }

    setIsSubmitting(true)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

      // Use an isolated client with persistSession: false so the current admin session is never disturbed
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      })

      // 1. Sign up user in Supabase Auth with metadata for seed.sql handle_new_user() trigger
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: newUserData.email.trim().toLowerCase(),
        password: newUserData.password,
        options: {
          data: {
            full_name: newUserData.full_name.trim(),
            role: newUserData.role,
            department: newUserData.department || "Medical Faculty & Operations"
          }
        }
      })

      if (authError) throw authError

      // Check if email already exists
      if (authData?.user && authData.user.identities && authData.user.identities.length === 0) {
        throw new Error("A user with this email address is already registered.")
      }

      const newUserId = authData?.user?.id
      if (newUserId) {
        // 2. Ensure public.users entry exists with correct role and status
        const userData = {
          id: newUserId,
          email: newUserData.email.trim().toLowerCase(),
          full_name: newUserData.full_name.trim(),
          role: newUserData.role,
          updated_at: new Date().toISOString()
        }
        
        // Only include is_deactivated if the table supports it
        try {
          // Try to add is_deactivated - if it fails, the column doesn't exist
          userData.is_deactivated = false
          
          await supabase
            .from("users")
            .upsert(userData)
        } catch (columnError) {
          // If is_deactivated column doesn't exist, try without it
          if (columnError?.message?.includes('is_deactivated')) {
            delete userData.is_deactivated
            await supabase
              .from("users")
              .upsert(userData)
          } else {
            throw columnError
          }
        }

        // 3. Upsert into the dedicated role table based on seed.sql schema
        if (newUserData.role === "itsd") {
          await supabase.from("itsd_users").upsert({
            user_id: newUserId,
            admin_level: newUserData.admin_level || "Tier 2 Support",
            specialization: newUserData.specialization || "Enterprise IT & Hardware Infrastructure",
            shift: "Day Shift",
            can_manage_assets: true
          }, { onConflict: "user_id" })
        } else if (newUserData.role === "inventory_staff") {
          await supabase.from("inventory_staff_users").upsert({
            user_id: newUserId,
            warehouse_location: newUserData.warehouse_location || "Central IT Warehouse - Bay 4",
            inventory_tier: newUserData.inventory_tier || "Stock Custodian",
            badge_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`
          }, { onConflict: "user_id" })
        } else {
          // end_user
          await supabase.from("end_users").upsert({
            user_id: newUserId,
            department: newUserData.department || "Medical Faculty & Operations",
            employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
            job_title: newUserData.job_title || "Clinical Staff"
          }, { onConflict: "user_id" })
        }
      }

      // Reset form and close modal
      setNewUserData({
        email: "",
        password: "",
        full_name: "",
        role: "end_user",
        department: "Medical Faculty & Operations",
        job_title: "Clinical Staff",
        warehouse_location: "Central IT Warehouse - Bay 4",
        inventory_tier: "Stock Custodian",
        admin_level: "Tier 2 Support",
        specialization: "Enterprise IT & Hardware Infrastructure"
      })
      setShowAddUserModal(false)

      setSuccessMessage(`User "${newUserData.full_name}" created successfully!`)
      setTimeout(() => setSuccessMessage(""), 5000)

      // Refresh list
      await fetchUsers()

    } catch (err) {
      console.error("Error creating user:", err)
      setModalError(err.message || "Failed to create user. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ITSDLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-[5px] bg-gradient-to-r from-red-900 via-red-800 to-zinc-900 text-white p-4 sm:p-5 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] text-xs font-semibold bg-white/15 backdrop-blur-xs text-red-100">
              <Users className="size-3.5" />
              Administrator Panel
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              User Account Management
            </h2>
            <p className="text-xs sm:text-sm text-red-100/80 leading-relaxed">
              Manage system users, RBAC roles, and account permissions. Add new accounts and activate or deactivate access according to system security policies.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
            <ShieldCheck className="size-72" />
          </div>
          
          {/* Debug Button for Troubleshooting */}
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  // Test database schema
                  const { data, error } = await supabase
                    .from("users")
                    .select("id, email, is_deactivated")
                    .limit(1)
                  
                  if (error) {
                    alert(`Database Issue: ${error.message}`)
                  } else {
                    alert("Database schema looks good! ✓")
                  }
                } catch (err) {
                  alert(`Connection Error: ${err.message}`)
                }
              }}
              className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Test DB Setup
            </Button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-[5px] text-emerald-700 dark:text-emerald-300 text-xs">
            <CheckCircle className="size-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-[5px]">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span className="text-xs text-red-600">{error}</span>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{userStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{userStats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-lg font-bold text-red-600">{userStats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-lg font-bold text-red-600">{userStats.itsd}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{userStats.inventory_staff}</p>
                <p className="text-xs text-muted-foreground">IT Specialists</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[5px]">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{userStats.end_user}</p>
                <p className="text-xs text-muted-foreground">End Users</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="rounded-[5px]">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:w-auto">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                  <Input
                    placeholder="Search name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-[5px] text-xs"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="rounded-[5px] text-xs sm:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="rounded-[5px] text-xs sm:w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="itsd">ITSD Admin</SelectItem>
                    <SelectItem value="inventory_staff">IT Specialist</SelectItem>
                    <SelectItem value="end_user">End User</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUsers}
                  disabled={isLoading}
                  className="rounded-[5px] text-xs gap-1.5"
                  title="Refresh Users"
                >
                  <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <Button
                onClick={() => {
                  setModalError("")
                  setShowAddUserModal(true)
                }}
                className="rounded-[5px] text-xs gap-1.5 bg-red-700 hover:bg-red-800 text-white w-full sm:w-auto"
              >
                <Plus className="size-3.5" />
                Add User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="rounded-[5px]">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">System Users</h3>
              <p className="text-xs text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} registered accounts
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="size-6 animate-spin text-red-600 mr-2.5" />
              <span className="text-xs text-muted-foreground">Loading users from database...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">User & Profile</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Role Details</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Login</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                  {filteredUsers.map((user) => {
                    const role = roleConfig[user.role] || roleConfig.end_user
                    const RoleIcon = role.icon
                    const isSelf = user.id === currentAdminUser?.id

                    // Resolve role details based on seed.sql dedicated role tables
                    let roleDetailText = "—"
                    if (user.role === "itsd") {
                      const itsd = Array.isArray(user.itsd_users) ? user.itsd_users[0] : user.itsd_users
                      roleDetailText = itsd?.admin_level || itsd?.specialization || "Tier 2 Support"
                    } else if (user.role === "inventory_staff") {
                      const inv = Array.isArray(user.inventory_staff_users) ? user.inventory_staff_users[0] : user.inventory_staff_users
                      roleDetailText = inv?.warehouse_location || inv?.inventory_tier || "IT Specialist"
                    } else {
                      const end = Array.isArray(user.end_users) ? user.end_users[0] : user.end_users
                      roleDetailText = end?.department || end?.job_title || "General Staff"
                    }

                    return (
                      <tr key={user.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="font-medium text-foreground flex items-center gap-1.5">
                                {user.full_name || "Unnamed User"}
                                {isSelf && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-normal">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                ID: {user.id ? `${user.id.substring(0, 8)}...` : "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <RoleIcon className={`size-3.5 ${
                              user.role === "itsd" ? "text-red-600" : user.role === "inventory_staff" ? "text-blue-600" : "text-emerald-600"
                            }`} />
                            <span className="font-medium">{role.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="text-xs truncate max-w-[180px] inline-block" title={roleDetailText}>
                            {roleDetailText}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${
                            user.is_deactivated === true
                              ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}>
                            {user.is_deactivated === true ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.last_login_at 
                            ? new Date(user.last_login_at).toLocaleDateString()
                            : user.created_at
                            ? `Joined ${new Date(user.created_at).toLocaleDateString()}`
                            : "Never"
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isSelf ? (
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-[5px]">
                              Current Admin
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoadingId === user.id}
                              onClick={() => handleToggleUserStatus(user.id, user.is_deactivated === true, user.full_name)}
                              className={`rounded-[5px] text-xs h-7 px-2.5 ${
                                user.is_deactivated === true
                                  ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                  : "text-red-700 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
                              }`}
                            >
                              {actionLoadingId === user.id ? (
                                <>
                                  <Loader2 className="size-3 animate-spin mr-1" />
                                  Updating...
                                </>
                              ) : user.is_deactivated === true ? (
                                <>
                                  <CheckCircle className="size-3 mr-1 text-emerald-600" />
                                  Activate
                                </>
                              ) : (
                                <>
                                  <XCircle className="size-3 mr-1 text-red-600" />
                                  Deactivate
                                </>
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredUsers.length === 0 && !isLoading && (
                <div className="text-center p-10 text-muted-foreground">
                  <Users className="size-10 mx-auto mb-2 opacity-40 text-muted-foreground" />
                  <p className="text-sm font-medium">No users found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query or filters</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
              onClick={() => !isSubmitting && setShowAddUserModal(false)} 
            />
            
            <Card className="relative w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto z-10 border border-zinc-200 dark:border-zinc-800">
              <div className="p-4 border-b">
                <h3 className="font-bold text-base text-foreground">Add New User</h3>
                <p className="text-xs text-muted-foreground">
                  Create a new account with dedicated role provisioning based on seed schema
                </p>
              </div>

              {modalError && (
                <div className="m-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-[5px] flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAddUser} className="p-4 space-y-4">
                {/* Full Name */}
                <div>
                  <Label className="text-xs font-medium">
                    Full Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    value={newUserData.full_name}
                    onChange={(e) => setNewUserData({...newUserData, full_name: e.target.value})}
                    placeholder="e.g., Jane Doe"
                    className="rounded-[5px] text-xs mt-1"
                    required
                  />
                </div>

                {/* Email Address */}
                <div>
                  <Label className="text-xs font-medium">
                    Email Address <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    placeholder="e.g., jane.doe@itams.edu"
                    className="rounded-[5px] text-xs mt-1"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <Label className="text-xs font-medium">
                    Password <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                      placeholder="Minimum 6 characters"
                      className="rounded-[5px] text-xs pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 size-7 p-0"
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <Label className="text-xs font-medium">
                    Role <span className="text-red-600">*</span>
                  </Label>
                  <Select 
                    value={newUserData.role} 
                    onValueChange={(value) => setNewUserData({...newUserData, role: value})}
                  >
                    <SelectTrigger className="rounded-[5px] text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="end_user">End User (Faculty / Staff Requester)</SelectItem>
                      <SelectItem value="inventory_staff">IT Specialist (Inventory Custodian)</SelectItem>
                      <SelectItem value="itsd">ITSD Admin (System Administrator)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Specific Fields based on seed.sql tables */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-[5px] border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                  <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    {newUserData.role === "itsd" ? (
                      <>
                        <Shield className="size-3 text-red-600" />
                        ITSD Admin Role Details
                      </>
                    ) : newUserData.role === "inventory_staff" ? (
                      <>
                        <Package className="size-3 text-blue-600" />
                        IT Specialist Role Details
                      </>
                    ) : (
                      <>
                        <Laptop className="size-3 text-emerald-600" />
                        End User Role Details
                      </>
                    )}
                  </p>

                  {newUserData.role === "end_user" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Department</Label>
                        <Input
                          value={newUserData.department}
                          onChange={(e) => setNewUserData({...newUserData, department: e.target.value})}
                          placeholder="e.g., Medical Faculty & Operations"
                          className="rounded-[5px] text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Job Title</Label>
                        <Input
                          value={newUserData.job_title}
                          onChange={(e) => setNewUserData({...newUserData, job_title: e.target.value})}
                          placeholder="e.g., Clinical Staff"
                          className="rounded-[5px] text-xs mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {newUserData.role === "inventory_staff" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Warehouse Location</Label>
                        <Input
                          value={newUserData.warehouse_location}
                          onChange={(e) => setNewUserData({...newUserData, warehouse_location: e.target.value})}
                          placeholder="e.g., Central IT Warehouse - Bay 4"
                          className="rounded-[5px] text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Inventory Tier</Label>
                        <Input
                          value={newUserData.inventory_tier}
                          onChange={(e) => setNewUserData({...newUserData, inventory_tier: e.target.value})}
                          placeholder="e.g., Stock Custodian"
                          className="rounded-[5px] text-xs mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {newUserData.role === "itsd" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Admin Level</Label>
                        <Select
                          value={newUserData.admin_level}
                          onValueChange={(val) => setNewUserData({...newUserData, admin_level: val})}
                        >
                          <SelectTrigger className="rounded-[5px] text-xs mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tier 1 Support">Tier 1 Support</SelectItem>
                            <SelectItem value="Tier 2 Support">Tier 2 Support</SelectItem>
                            <SelectItem value="Tier 3 Lead Admin">Tier 3 Lead Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Specialization</Label>
                        <Input
                          value={newUserData.specialization}
                          onChange={(e) => setNewUserData({...newUserData, specialization: e.target.value})}
                          placeholder="e.g., Enterprise IT & Hardware"
                          className="rounded-[5px] text-xs mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1 rounded-[5px] text-xs"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-[5px] text-xs bg-red-700 hover:bg-red-800 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Creating User...
                      </>
                    ) : (
                      <>
                        <Plus className="size-3.5 mr-1.5" />
                        Create User
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </ITSDLayout>
  )
}

export default UserManagementPage