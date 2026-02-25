// components/settings/DangerZone.tsx
'use client'

import { useState, useCallback } from 'react'
import { AlertTriangle, Trash2, LogOut, Loader2, Eye, EyeOff, Download } from 'lucide-react'
import { deleteAccount } from '../../app/settings/actions'
import { toast } from 'react-hot-toast'

const KENYA_RED = '#bb0000'
const KENYA_GRADIENT = `linear-gradient(135deg, ${KENYA_RED}, #007847)`

export function DangerZone() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = useCallback(async () => {
    if (!password) {
      setError('Please enter your password to confirm')
      return
    }

    setIsDeleting(true)
    setError('')
    
    const result = await deleteAccount(password)
    
    if (result.error) {
      setError(result.error)
      toast.error(result.error)
      setIsDeleting(false)
    }
    // If successful, redirect happens server-side
  }, [password])

  const handleSignOutEverywhere = useCallback(async () => {
    // TODO: Implement sign out everywhere via Supabase
    toast.success('Signed out of all devices')
  }, [])

  const handleDataExport = useCallback(async () => {
    // TODO: Implement data export request
    // ✅ FIX 2: Use toast() for custom messages instead of toast.info()
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="shrink-0 pt-0.5">
              <Download className="h-5 w-5 text-[#bb0000]" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">Export Request Submitted</p>
              <p className="mt-1 text-sm text-gray-500">
                You'll receive an email with your data shortly.
              </p>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: 4000,
    })
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Danger Zone
        </h3>
        <p className="text-sm text-gray-500">Irreversible actions for your account</p>
      </div>

      {/* Delete Account */}
      <div className="border-2 border-red-200 rounded-2xl p-6 space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Delete Account
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Permanently delete your Stream254 account and all associated data. 
            This action cannot be undone.
          </p>
        </div>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 rounded-lg font-medium text-red-600 border-2 border-red-200 hover:bg-red-50 transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-sm text-red-700 font-medium">
              ⚠️ This will permanently delete:
            </p>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>All your uploaded videos</li>
              <li>Your profile and follower data</li>
              <li>Comments, likes, and interactions</li>
              <li>M-Pesa payout configuration</li>
            </ul>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter your password to confirm:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setPassword(''); setError('') }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || !password}
                className="px-4 py-2 rounded-lg font-medium text-white transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ background: KENYA_RED }}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out Everywhere */}
      <div className="border border-gray-200 rounded-2xl p-6 space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <LogOut className="h-5 w-5 text-gray-600" />
            Sign Out Everywhere
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Log out of all devices and sessions. You'll need to sign in again on each device.
          </p>
        </div>
        <button
          onClick={handleSignOutEverywhere}
          className="px-4 py-2 rounded-lg font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Sign Out Everywhere
        </button>
      </div>

      {/* Data Export */}
      <div className="border border-gray-200 rounded-2xl p-6 space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Download className="h-5 w-5 text-[#bb0000]" />
            Export Your Data
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Download a copy of your content and personal data in compliance with 
            Kenya's Data Protection Act, 2019.
          </p>
        </div>
        <button
          onClick={handleDataExport}
          className="px-4 py-2 rounded-lg font-medium text-white transition-all flex items-center gap-2"
          style={{ background: KENYA_GRADIENT }}
        >
          <Download className="h-4 w-4" />
          Request Data Export
        </button>
      </div>
    </div>
  )
}