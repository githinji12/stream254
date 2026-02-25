import { createClient } from '@/lib/supabase/server'

export default async function TestDB() {
  const supabase = await createClient()
  
  // Test connection to videos table
  const { data, error } = await supabase.from('videos').select('*').limit(1)
  
  if (error) {
    return (
      <div className="p-8 text-red-600">
        ❌ Database Error: {error.message}
        <br />
        <span className="text-sm">Check your .env.local keys and SQL setup</span>
      </div>
    )
  }
  
  return (
    <div className="p-8 text-green-600">
      ✅ Database Connected Successfully!
      <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}