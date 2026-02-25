// app/test-storage/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestStorage() {
  const [result, setResult] = useState<any>(null)
  const supabase = createClient()

  const testUpload = async () => {
    // Create a tiny test file (1KB)
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    try {
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(`test-${Date.now()}.txt`, testFile)
      
      setResult({ success: !error, error: error?.message, data })
    } catch (err: any) {
      setResult({ success: false, error: err.message })
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Storage Test</h1>
      <button
        onClick={testUpload}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test Upload
      </button>
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}