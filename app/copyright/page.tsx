// app/copyright/page.tsx
'use client'

import Link from 'next/link'
import { ChevronRight, Copyright, FileText, Mail, CheckCircle } from 'lucide-react'

const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
}

export default function CopyrightPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 pattern-savanna">
      <div className="fixed top-16 left-0 right-0 kenya-stripe z-30" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: `linear-gradient(135deg, ${KENYA.black}, ${KENYA.red})` }}>
            <Copyright className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span style={{ color: KENYA.black }}>Copyright</span>
            <span style={{ color: KENYA.red }}> Policy</span>
          </h1>
          <p className="text-gray-600">Protecting intellectual property rights</p>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#bb0000] transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Copyright Policy</span>
        </nav>

        <div className="card-kenya p-6 sm:p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Our Commitment to IP Rights</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                Stream254 respects the intellectual property rights of creators and copyright holders. We are 
                committed to complying with the Kenya Copyright Act and international copyright laws, including 
                the Digital Millennium Copyright Act (DMCA).
              </p>
              <p className="mt-3">
                This policy outlines how we handle copyright infringement claims and how you can protect your 
                intellectual property on our platform.
              </p>
            </div>
          </section>

          {/* For Copyright Holders */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">For Copyright Holders: Submitting a Takedown Notice</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>If you believe your copyrighted work has been infringed on Stream254, please submit a takedown notice that includes:</p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li>Your physical or electronic signature</li>
                <li>Identification of the copyrighted work you claim has been infringed</li>
                <li>Identification of the infringing content (URL or description)</li>
                <li>Your contact information (address, phone, email)</li>
                <li>A statement that you have a good faith belief that the use is not authorized</li>
                <li>A statement that the information in the notice is accurate and you are authorized to act on behalf of the copyright owner</li>
              </ul>

              <div className="mt-4 p-4 rounded-lg" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <p className="text-sm font-medium" style={{ color: '#0369a1' }}>
                  Send takedown notices to: <strong>copyright@stream254.co.ke</strong>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Subject line: "Copyright Infringement Notice"
                </p>
              </div>
            </div>
          </section>

          {/* For Users */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">For Users: Counter-Notice</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                If your content was removed due to a copyright claim and you believe it was a mistake, you may 
                submit a counter-notice that includes:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li>Your physical or electronic signature</li>
                <li>Identification of the removed content</li>
                <li>A statement under penalty of perjury that you have a good faith belief the content was removed mistakenly</li>
                <li>Your contact information and consent to local court jurisdiction</li>
              </ul>
              <p className="mt-3">
                Send counter-notices to <strong>copyright@stream254.co.ke</strong>. We will forward your 
                counter-notice to the claimant and may restore the content within 10-14 business days unless 
                the claimant files a legal action.
              </p>
            </div>
          </section>

          {/* Repeat Infringers */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Repeat Infringers</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                Stream254 will terminate the accounts of users who repeatedly infringe copyright. We consider 
                multiple valid takedown notices against a user as grounds for account termination.
              </p>
            </div>
          </section>

          {/* Best Practices */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Best Practices for Users</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {[
                { title: 'Create Original Content', desc: 'Upload only content you created or have permission to use' },
                { title: 'Use Licensed Music', desc: 'Use royalty-free or properly licensed music in your videos' },
                { title: 'Give Credit', desc: 'Attribute any third-party content you include with permission' },
                { title: 'Understand Fair Use', desc: 'Fair use is limited; when in doubt, seek legal advice' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg" style={{ background: '#f0fdf4' }}>
                  <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: KENYA.green }} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Copyright Contact</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>For copyright-related inquiries:</p>
              <div className="mt-3 p-4 rounded-lg" style={{ background: '#fafafa', border: '1px solid #e5e7eb' }}>
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="h-5 w-5" style={{ color: KENYA.red }} />
                  <span className="font-medium">copyright@stream254.co.ke</span>
                </div>
                <p className="text-sm text-gray-600">
                  📍 Stream254 Copyright Agent<br />
                  Nairobi, Kenya
                </p>
              </div>
            </div>
          </section>

          {/* Accept Button */}
          <div className="pt-6 border-t border-gray-200">
            <Link href="/upload" className="btn-kenya-secondary inline-flex items-center gap-2">
              <FileText className="h-4 w-4" />
              I Understand - Upload Content
            </Link>
          </div>
        </div>

     
      
      </div>
    </div>
  )
}