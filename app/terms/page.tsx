// app/terms/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, BookOpen, AlertCircle } from 'lucide-react'

const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
}

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('')

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'services', title: '2. Description of Service' },
    { id: 'account', title: '3. Account Registration' },
    { id: 'conduct', title: '4. User Conduct' },
    { id: 'content', title: '5. User Content' },
    { id: 'ip', title: '6. Intellectual Property' },
    { id: 'termination', title: '7. Termination' },
    { id: 'disclaimer', title: '8. Disclaimers' },
    { id: 'liability', title: '9. Limitation of Liability' },
    { id: 'governing', title: '10. Governing Law' },
    { id: 'changes', title: '11. Changes to Terms' },
    { id: 'contact', title: '12. Contact Information' },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 pattern-savanna">
      <div className="fixed top-16 left-0 right-0 kenya-stripe z-30" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.green})` }}>
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span style={{ color: KENYA.red }}>Terms of</span>
            <span style={{ color: KENYA.black }}> Service</span>
          </h1>
          <p className="text-gray-600">Last updated: January 2025</p>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#bb0000] transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Terms of Service</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1">
            <div className="card-kenya p-4 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-3">Table of Contents</h2>
              <ul className="space-y-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => {
                        setActiveSection(section.id)
                        document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="text-sm text-gray-600 hover:text-[#bb0000] transition-colors text-left w-full py-1"
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="card-kenya p-6 sm:p-8 space-y-8">
              
              {/* Introduction */}
              <div className="p-4 rounded-lg" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: KENYA.red }} />
                  <p className="text-sm" style={{ color: '#991b1b' }}>
                    <strong>Important:</strong> Please read these Terms of Service carefully before using Stream254. 
                    By accessing or using our platform, you agree to be bound by these terms.
                  </p>
                </div>
              </div>

              {/* Section 1 */}
              <section id="acceptance" className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>
                    Welcome to Stream254 ("we", "our", "us"). These Terms of Service ("Terms") constitute a legally 
                    binding agreement between you ("User", "you", "your") and Stream254, governing your access to 
                    and use of our video sharing platform, website, and related services (collectively, the "Service").
                  </p>
                  <p className="mt-3">
                    By accessing, browsing, or using Stream254, you acknowledge that you have read, understood, and 
                    agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, 
                    you must not access or use the Service.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="services" className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>
                    Stream254 is a video sharing platform that allows users to upload, view, share, and interact 
                    with video content. Our Service includes:
                  </p>
                  <ul className="list-disc list-inside mt-3 space-y-1">
                    <li>Video upload and hosting capabilities</li>
                    <li>Video streaming and playback</li>
                    <li>User profiles and channels</li>
                    <li>Comments, likes, and social features</li>
                    <li>Follow/follower functionality</li>
                    <li>Search and discovery features</li>
                  </ul>
                  <p className="mt-3">
                    We reserve the right to modify, suspend, or discontinue any part of the Service at any time 
                    without prior notice.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section id="account" className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Account Registration</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>To use certain features of Stream254, you must create an account. You agree to:</p>
                  <ul className="list-disc list-inside mt-3 space-y-1">
                    <li>Provide accurate, current, and complete information during registration</li>
                    <li>Maintain and promptly update your account information</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Notify us immediately of any unauthorized access to your account</li>
                    <li>Be at least 13 years old (or the minimum age in your jurisdiction)</li>
                  </ul>
                  <p className="mt-3">
                    You are responsible for all activities that occur under your account. We reserve the right to 
                    terminate or suspend accounts at our discretion.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section id="conduct" className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. User Conduct</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>You agree not to:</p>
                  <ul className="list-disc list-inside mt-3 space-y-1">
                    <li>Upload content that violates any laws or regulations</li>
                    <li>Post content that is hateful, discriminatory, or harassing</li>
                    <li>Impersonate any person or entity</li>
                    <li>Upload viruses, malware, or malicious code</li>
                    <li>Spam, advertise, or solicit without permission</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Interfere with or disrupt the Service</li>
                    <li>Use automated systems to access the Service without permission</li>
                  </ul>
                  <p className="mt-3">
                    Violation of these conduct rules may result in account termination and legal action.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section id="content" className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. User Content</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>
                    You retain ownership of content you upload to Stream254. However, by uploading content, you 
                    grant us a non-exclusive, worldwide, royalty-free license to use, display, distribute, and 
                    modify your content for the purpose of operating and promoting the Service.
                  </p>
                  <p className="mt-3">
                    You are solely responsible for your content and must have all necessary rights and permissions 
                    to upload it. We reserve the right to remove any content that violates these Terms.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="ip" className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Intellectual Property</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>
                    Stream254, its logo, and all related content (excluding user content) are owned by Stream254 
                    and protected by Kenyan and international intellectual property laws. You may not use our 
                    trademarks, logos, or copyrighted material without prior written permission.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section id="termination" className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Termination</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>
                    We may terminate or suspend your account and access to the Service immediately, without prior 
                    notice, for conduct that we believe violates these Terms or is harmful to other users, us, or 
                    third parties, or for any other reason at our discretion.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="disclaimer" className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Disclaimers</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
                    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, 
                    FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="liability" className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, STREAM254 SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                    INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, 
                    WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER 
                    INTANGIBLE LOSSES.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section id="governing" className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 mb-3">10. Governing Law</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of the Republic 
                    of Kenya, without regard to its conflict of law provisions. Any disputes arising from these 
                    Terms shall be subject to the exclusive jurisdiction of the courts of Kenya.
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section id="changes" className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 mb-3">11. Changes to Terms</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>
                    We reserve the right to modify these Terms at any time. We will notify users of material 
                    changes via email or prominent notice on the Service. Your continued use of the Service 
                    after such changes constitutes acceptance of the new Terms.
                  </p>
                </div>
              </section>

              {/* Section 12 */}
              <section id="contact" className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 mb-3">12. Contact Information</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p>For questions about these Terms of Service, please contact us:</p>
                  <ul className="list-none mt-3 space-y-1">
                    <li>📧 Email: legal@stream254.co.ke</li>
                    <li>📍 Address: Nairobi, Kenya</li>
                    <li>📱 Phone: +254 700 000 000</li>
                  </ul>
                </div>
              </section>

              {/* Accept Button */}
              <div className="pt-6 border-t border-gray-200">
                <Link href="/signup" className="btn-kenya-primary inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  I Accept - Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}