// components/layout/Footer.tsx
'use client'

import { useState } from 'react'
import { Video, Mail, MapPin, Phone, Github, Twitter, Instagram, Youtube, Heart, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// 🎨 Kenyan Design Constants
const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
  white: '#ffffff',
}

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    
    // TODO: Connect to your newsletter service (Mailchimp, ConvertKit, etc.)
    // For now, simulate success
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSubscribed(true)
    setEmail('')
    setLoading(false)
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#0a0a0a] text-white mt-auto">
      {/* 🇰🇪 Kenyan Flag Stripe Top */}
      <div className="h-1.5 w-full" style={{ 
        background: 'linear-gradient(90deg, #007847 0%, #007847 33%, #000000 33%, #000000 34%, #bb0000 34%, #bb0000 66%, #000000 66%, #000000 67%, #007847 67%, #007847 100%)' 
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* ========== MAIN FOOTER CONTENT ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Column 1: Brand & About */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="p-2 rounded-lg bg-linear-to-br from-[#bb0000] to-[#007847] group-hover:scale-105 transition-transform">
                <Video className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl">
                <span style={{ color: KENYA.red }}>Stream</span>
                <span style={{ color: KENYA.white }}>254</span>
              </span>
            </Link>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              🇰🇪 Empowering African creators to share their stories with the world. 
              Built with pride in Kenya for the global community.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <MapPin className="h-4 w-4" style={{ color: KENYA.red }} />
                <span>Nairobi, Kenya</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="h-4 w-4" style={{ color: KENYA.green }} />
                <span>support@stream254.co.ke</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="h-4 w-4" style={{ color: KENYA.red }} />
                <span>+254 700 000 000</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4" style={{ color: KENYA.white }}>
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Home', href: '/' },
                { label: 'Browse Videos', href: '/' },
                { label: 'Upload Video', href: '/upload' },
                { label: 'Trending', href: '/trending' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-[#bb0000] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: KENYA.red }} />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Account & Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4" style={{ color: KENYA.white }}>
              Account & Legal
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Login', href: '/login' },
                { label: 'Sign Up', href: '/signup' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Community Guidelines', href: '/guidelines' },
                { label: 'Copyright Policy', href: '/copyright' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-[#007847] transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: KENYA.green }} />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter & Social */}
          <div>
            <h3 className="font-semibold text-lg mb-4" style={{ color: KENYA.white }}>
              Stay Connected
            </h3>
            
            {/* Newsletter Signup */}
            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="mb-6">
                <p className="text-gray-400 text-sm mb-3">
                  Get the latest videos and creator updates delivered to your inbox.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#bb0000] focus:ring-1 focus:ring-[#bb0000]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1"
                    style={{ 
                      background: KENYA.red,
                      color: KENYA.white
                    }}
                  >
                    {loading ? (
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">Subscribe</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-4 rounded-lg bg-green-900/20 border border-green-800">
                <p className="text-green-400 text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Thanks for subscribing! 🇰🇪
                </p>
              </div>
            )}

            {/* Social Media Links */}
            <div>
              <h4 className="font-medium text-sm mb-3 text-gray-300">Follow Us</h4>
              <div className="flex gap-3">
                {[
                  { icon: Twitter, href: 'https://twitter.com/stream254', label: 'Twitter' },
                  { icon: Instagram, href: 'https://instagram.com/stream254', label: 'Instagram' },
                  { icon: Youtube, href: 'https://youtube.com/@stream254', label: 'YouTube' },
                  { icon: Github, href: 'https://github.com/stream254', label: 'GitHub' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-gray-800 rounded-lg hover:bg-[#bb0000] transition-colors duration-300 group"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5 text-gray-400 group-hover:text-white" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========== BOTTOM BAR ========== */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <p className="text-gray-500 text-sm text-center md:text-left">
              © {currentYear} Stream254. All rights reserved.
            </p>

            {/* Made with Love */}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>Made with</span>
              <Heart className="h-4 w-4" style={{ color: KENYA.red }} />
              <span>in Kenya</span>
              <span className="mx-1">🇰🇪</span>
            </div>

            {/* Bottom Links */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/terms" className="text-gray-500 hover:text-[#bb0000] transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-500 hover:text-[#007847] transition-colors">
                Privacy
              </Link>
            
            </div>
          </div>
        </div>

       
      </div>
    </footer>
  )
}