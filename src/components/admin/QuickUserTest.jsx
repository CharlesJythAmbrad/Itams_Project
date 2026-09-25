import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { supabase } from '../../lib/supabaseClient'

const QuickUserTest = () => {
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState(null)

  const createTestUser = async () => {
    setIsCreating(true)
    setResult(null)
    
    const timestamp = Date.now()
    const testUser = {
      email: `test${timestamp}@example.com`,
      password: 'test123456',
      full_name: `Test User ${timestamp}`,
      role: 'end_user',
      department: 'Test Department',
      job_title: 'Test Staff'
    }

    try {
      console.log('Creating test user:', testUser)

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            full_name: testUser.full_name,
            role: testUser.role,
            department: testUser.department,
            job_title: testUser.job_title
          }
        }
      })

      if (authError) throw authError

      const userId = authData?.user?.id
      console.log('Auth user created:', userId)

      // Step 2: Wait and check if user was created in public.users
      await new Promise(resolve => setTimeout(resolve, 3000))

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          end_users(*)
        `)
        .eq('id', userId)
        .single()

      console.log('User data check:', userData, userError)

      setResult({
        success: !userError,
        authUser: authData?.user,
        publicUser: userData,
        error: userError?.message || authError?.message
      })

    } catch (err) {
      console.error('Test creation failed:', err)
      setResult({
        success: false,
        error: err.message
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Quick User Creation Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={createTestUser}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? 'Creating Test User...' : 'Create Test User'}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`font-semibold mb-2 ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ Success' : '❌ Failed'}
            </h3>
            
            {result.authUser && (
              <div className="text-sm space-y-1">
                <p><strong>Auth User:</strong> {result.authUser.email}</p>
                <p><strong>User ID:</strong> {result.authUser.id}</p>
              </div>
            )}

            {result.publicUser && (
              <div className="text-sm space-y-1 mt-2">
                <p><strong>Public User:</strong> {result.publicUser.full_name}</p>
                <p><strong>Role:</strong> {result.publicUser.role}</p>
                <p><strong>Role Record:</strong> {result.publicUser.end_users ? 'Created' : 'Missing'}</p>
              </div>
            )}

            {result.error && (
              <div className="text-sm text-red-700 mt-2">
                <p><strong>Error:</strong> {result.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default QuickUserTest