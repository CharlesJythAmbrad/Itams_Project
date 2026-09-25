import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldX, LogOut, Phone, Mail } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { useAuth } from '../../hooks/useAuth'

const AccountDeactivatedScreen = () => {
  const { signOut } = useAuth()

  // Auto sign-out after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      signOut()
    }, 10000) // Auto sign-out after 10 seconds

    return () => clearTimeout(timer)
  }, [signOut])

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        <Card className="border-red-200 dark:border-red-800 shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center">
                <ShieldX className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Title and Message */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-red-700 dark:text-red-300">
                Account Deactivated
              </h1>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Your account has been deactivated by an administrator. 
                You cannot access the ITAMS Portal until your account is reactivated.
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                Need Help?
              </h3>
              <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Contact ITSD Admin: admin@itams.edu</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>Call IT Support: (555) 123-4567</span>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="pt-4">
              <Button 
                onClick={handleSignOut}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                You will be automatically signed out in 10 seconds
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default AccountDeactivatedScreen