import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Shield, ShieldX } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const TestDeactivationButton = ({ userId, isDeactivated, userName, onStatusChanged }) => {
  const [isLoading, setIsLoading] = useState(false)

  const toggleDeactivation = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const newStatus = !isDeactivated

      const { error } = await supabase
        .from('users')
        .update({ 
          is_deactivated: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Call callback to refresh the user list
      if (onStatusChanged) {
        onStatusChanged()
      }

      alert(`✓ ${userName} has been ${newStatus ? 'deactivated' : 'reactivated'}`)
      
    } catch (err) {
      console.error('Error toggling user status:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={toggleDeactivation}
      disabled={isLoading}
      size="sm"
      variant={isDeactivated ? "default" : "destructive"}
      className="text-xs"
    >
      {isLoading ? (
        "Processing..."
      ) : isDeactivated ? (
        <>
          <Shield className="w-3 h-3 mr-1" />
          Activate
        </>
      ) : (
        <>
          <ShieldX className="w-3 h-3 mr-1" />
          Deactivate
        </>
      )}
    </Button>
  )
}

export default TestDeactivationButton