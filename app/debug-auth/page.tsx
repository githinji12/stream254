// app/debug-auth/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugAuth() {
  const [info, setInfo] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const sessionResult = await supabase.auth.getSession()
      const userResult = await supabase.auth.getUser()
      
      setInfo({
        hasSession: !!sessionResult.data?.session,
        userId: sessionResult.data?.session?.user?.id,
        userEmail: sessionResult.data?.session?.user?.email,
        getUserError: userResult.error?.message,
      })
    }
    checkAuth()
  }, [supabase])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
        {JSON.stringify(info, null, 2)}
      </pre>
    </div>
  )
}