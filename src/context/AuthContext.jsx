import { createContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Helper to fetch base user record and dedicated role table details
  const fetchUserData = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return null
    }

    try {
      // 1. Fetch base user record from public.users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, full_name, role, created_at")
        .eq("id", userId)
        .maybeSingle()

      if (userError && userError.code !== "PGRST116") {
        console.warn("Could not fetch user record:", userError.message)
      }

      // Determine role from users table or fall back to user_metadata
      const sessionUser = (await supabase.auth.getSession()).data.session?.user
      const role = userData?.role || sessionUser?.user_metadata?.role || "end_user"
      let roleDetails = null

      // 2. Fetch specific role details from the dedicated role table safely with maybeSingle()
      if (role === "itsd") {
        const { data: itsdData } = await supabase
          .from("itsd_users")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
        roleDetails = itsdData
      } else if (role === "inventory_staff") {
        const { data: invData } = await supabase
          .from("inventory_staff_users")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
        roleDetails = invData
      } else {
        const { data: endUserData } = await supabase
          .from("end_users")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
        roleDetails = endUserData
      }

      const combined = {
        ...(userData || {}),
        full_name: userData?.full_name || sessionUser?.user_metadata?.full_name || sessionUser?.email?.split("@")[0],
        email: userData?.email || sessionUser?.email,
        role,
        roleDetails,
      }

      setProfile(combined)
      return combined
    } catch (err) {
      console.warn("User data fetch error:", err.message)
      return null
    }
  }, [])

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (isMounted) {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          if (currentSession?.user) {
            await fetchUserData(currentSession.user.id)
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn("Auth initialization notice:", err.message)
          setError(err.message)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initAuth()

    // Listen to live Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (isMounted) {
          setSession(newSession)
          setUser(newSession?.user ?? null)
          if (newSession?.user) {
            await fetchUserData(newSession.user.id)
          } else {
            setProfile(null)
          }
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      if (subscription) subscription.unsubscribe()
    }
  }, [fetchUserData])

  // Sign In method directly calling Supabase
  const signIn = useCallback(async ({ identifier, password }) => {
    setError(null)
    setLoading(true)
    setIsAuthenticating(true)

    try {
      const cleanIdentifier = identifier.trim().toLowerCase()
      const email = cleanIdentifier.includes("@") ? cleanIdentifier : `${cleanIdentifier}@itams.edu`
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      setUser(data.user)
      setSession(data.session)
      const userProfile = await fetchUserData(data.user.id)

      // Keep isAuthenticating true for a brief moment to ensure the loading screen covers
      // the route transition and dashboard initial render seamlessly with no blank flicker
      setTimeout(() => {
        setIsAuthenticating(false)
      }, 700)

      return { success: true, user: data.user, profile: userProfile }
    } catch (err) {
      const errMsg = err.message || "Invalid login credentials."
      console.warn("Supabase signInWithPassword notice:", errMsg)
      setError(errMsg)
      setIsAuthenticating(false)
      return { success: false, error: errMsg }
    } finally {
      setLoading(false)
    }
  }, [fetchUserData])

  // Password Reset directly calling Supabase
  const resetPassword = useCallback(async (email) => {
    setError(null)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      return { success: true, message: `Password reset link sent to ${email}` }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Sign Out directly calling Supabase
  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
      setError(null)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const currentRole = profile?.role || user?.user_metadata?.role || "end_user"

  const value = {
    user,
    profile,
    role: currentRole,
    roleDetails: profile?.roleDetails || null,
    isITSD: currentRole === "itsd",
    isInventoryStaff: currentRole === "inventory_staff",
    isEndUser: currentRole === "end_user",
    session,
    loading,
    isAuthenticating,
    error,
    isAuthenticated: Boolean(user),
    signIn,
    resetPassword,
    signOut,
    clearError: () => setError(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
