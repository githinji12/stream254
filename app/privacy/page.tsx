// app/privacy/page.tsx
'use client'

import Link from 'next/link'
import { ChevronRight, Shield, Lock, Eye, Database } from 'lucide-react'

const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 pattern-savanna">
      <div className="fixed top-16 left-0 right-0 kenya-stripe z-30" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: `linear-gradient(135deg, ${KENYA.green}, ${KENYA.black})` }}>
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span style={{ color: KENYA.green }}>Privacy</span>
            <span style={{ color: KENYA.black }}> Policy</span>
          </h1>
          <p className="text-gray-600">Last updated: January 2025</p>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#bb0000] transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Privacy Policy</span>
        </nav>

        <div className="card-kenya p-6 sm:p-8 space-y-8">
          
          {/* Introduction */}
          <div className="p-4 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 shrink-0 mt-0.5" style={{ color: KENYA.green }} />
              <div>
                <p className="text-sm font-medium" style={{ color: '#166534' }}>
                  Your Privacy Matters to Us
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Stream254 is committed to protecting your personal data. This Privacy Policy explains how we 
                  collect, use, and safeguard your information in compliance with the Kenya Data Protection Act, 2019.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 mt-4">1.1 Information You Provide</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Account information (username, email, password)</li>
                <li>Profile information (full name, bio, avatar)</li>
                <li>Content you upload (videos, comments, messages)</li>
                <li>Communications with us (support requests, feedback)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4">1.2 Information Collected Automatically</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, videos watched, interactions)</li>
                <li>Location data (general geographic location)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li>Provide, maintain, and improve our Service</li>
                <li>Create and manage your account</li>
                <li>Personalize your experience</li>
                <li>Send you updates, notifications, and marketing communications (with your consent)</li>
                <li>Respond to your inquiries and support requests</li>
                <li>Detect, prevent, and address fraud, abuse, and security issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Information Sharing</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>We do not sell your personal information. We may share information with:</p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li><strong>Service Providers:</strong> Third parties who help us operate our Service (hosting, analytics, etc.)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Security</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                We implement appropriate technical and organizational measures to protect your personal information, 
                including encryption, access controls, and regular security assessments. However, no method of 
                transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Your Rights</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>Under the Kenya Data Protection Act, you have the right to:</p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your information (right to be forgotten)</li>
                <li>Object to or restrict processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact us at <strong>privacy@stream254.co.ke</strong>
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Cookies</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                We use cookies and similar technologies to enhance your experience, analyze usage, and serve 
                relevant content. You can control cookie settings through your browser preferences.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Data Retention</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                We retain your personal information for as long as necessary to provide our Service, comply with 
                legal obligations, and resolve disputes. You can request deletion of your account and data at 
                any time.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Children's Privacy</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                Stream254 is not intended for children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If we become aware of such collection, we will take steps to 
                delete the information.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. International Data Transfers</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                Your information may be transferred to and processed in countries other than Kenya. We ensure 
                appropriate safeguards are in place for such transfers in compliance with applicable data 
                protection laws.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes via 
                email or prominent notice on the Service. Your continued use of Stream254 after such changes 
                constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact Us</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>For privacy-related questions or concerns:</p>
              <ul className="list-none mt-3 space-y-1">
                <li>📧 Email: <strong>privacy@stream254.co.ke</strong></li>
                <li>📍 Address: Nairobi, Kenya</li>
                <li>📱 Phone: +254 700 000 000</li>
              </ul>
              <p className="mt-3">
                You may also lodge a complaint with the <strong>Office of the Data Protection Commissioner (Kenya)</strong>.
              </p>
            </div>
          </section>

          {/* Accept Button */}
          <div className="pt-6 border-t border-gray-200">
            <Link href="/signup" className="btn-kenya-secondary inline-flex items-center gap-2">
              <Shield className="h-4 w-4" />
              I Understand - Create Account
            </Link>
          </div>
        </div>

        
      </div>
    </div>
  )
}