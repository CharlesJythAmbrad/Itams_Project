import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import AccountDeactivatedScreen from './AccountDeactivatedScreen'
import AuthLoadingScreen from './AuthLoadingScreen'

const AccountStatusGuard = ({ children }) => {
  const { user, profile, signOut } = useAuth()
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isDeactivated, setIsDeactivated] = useState(false)

  useEffect(() => {
    // Check if user is deactivated based on profile data from AuthContext
    // The AuthContext already handles deactivation checks during login
    
    if (profile?.is_deactivated === true) {
      console.warn('User account is deactivated via profile check')
      setIsDeactivated(true)
      
      // Clear user session after a brief delay
      setTimeout(async () => {
        await signOut()
      }, 15000) // 15 seconds to show the message
      
      return
    }

    setIsDeactivated(false)
    setIsCheckingStatus(false)
  }, [profile?.is_deactivated, signOut])

  // Show deactivated screen if account is deactivated
  if (isDeactivated) {
    return <AccountDeactivatedScreen />
  }

  // Render children if account is active
  return children
}

export default AccountStatusGuard