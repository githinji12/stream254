// app/guidelines/page.tsx
'use client'

import Link from 'next/link'
import { ChevronRight, Heart, Shield, Users, Flag } from 'lucide-react'

const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
}

export default function GuidelinesPage() {
  const guidelines = [
    {
      icon: Heart,
      title: 'Be Respectful',
      description: 'Treat others with kindness and respect. Harassment, hate speech, and discrimination are not tolerated.',
      color: KENYA.red,
    },
    {
      icon: Shield,
      title: 'Keep It Safe',
      description: 'Do not post content that promotes violence, self-harm, or dangerous activities.',
      color: KENYA.green,
    },
    {
      icon: Users,
      title: 'Be Authentic',
      description: 'Do not impersonate others or create fake accounts. Be honest about who you are.',
      color: KENYA.black,
    },
    {
      icon: Flag,
      title: 'Report Violations',
      description: 'Help keep Stream254 safe by reporting content that violates these guidelines.',
      color: KENYA.red,
    },
  ]

  const prohibitedContent = [
    'Hate speech, discrimination, or harassment based on race, ethnicity, religion, gender, sexual orientation, disability, or age',
    'Violent or graphic content that glorifies violence or causes harm',
    'Sexually explicit or adult content',
    'Content that promotes illegal activities or regulated goods',
    'Spam, scams, or misleading content',
    'Impersonation of individuals, organizations, or entities',
    'Privacy violations (sharing personal information without consent)',
    'Copyright or trademark infringement',
    'Malware, viruses, or malicious code',
    'Content that exploits or harms children',
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 pattern-savanna">
      <div className="fixed top-16 left-0 right-0 kenya-stripe z-30" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.black})` }}>
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span style={{ color: KENYA.red }}>Community</span>
            <span style={{ color: KENYA.black }}> Guidelines</span>
          </h1>
          <p className="text-gray-600">Creating a safe and welcoming community for all</p>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#bb0000] transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Community Guidelines</span>
        </nav>

        {/* Core Principles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {guidelines.map((item, index) => (
            <div key={index} className="card-kenya p-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: `${item.color}20` }}>
                <item.icon className="h-6 w-6" style={{ color: item.color }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="card-kenya p-6 sm:p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Our Commitment</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                Stream254 is dedicated to fostering a creative, inclusive, and safe community where African 
                creators can share their stories and connect with audiences worldwide. These Community Guidelines 
                outline what is and isn't allowed on our platform.
              </p>
              <p className="mt-3">
                By using Stream254, you agree to follow these guidelines. We encourage all community members to 
                report content that violates these rules.
              </p>
            </div>
          </section>

          {/* Prohibited Content */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Prohibited Content</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>The following content is not allowed on Stream254:</p>
              <ul className="list-disc list-inside mt-3 space-y-2">
                {prohibitedContent.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Enforcement */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Enforcement</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>When content violates these guidelines, we may:</p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li>Remove the content</li>
                <li>Issue a warning to the user</li>
                <li>Temporarily suspend the account</li>
                <li>Permanently terminate the account</li>
                <li>Report to law enforcement (for illegal content)</li>
              </ul>
              <p className="mt-3">
                We review reports of violating content and take action within 24-48 hours. Repeat violations 
                may result in permanent account termination.
              </p>
            </div>
          </section>

          {/* Reporting */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">How to Report</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>To report violating content:</p>
              <ol className="list-decimal list-inside mt-3 space-y-1">
                <li>Click the report button on the video, comment, or profile</li>
                <li>Select the reason for your report</li>
                <li>Provide additional details (optional)</li>
                <li>Submit your report</li>
              </ol>
              <p className="mt-3">
                All reports are reviewed by our moderation team. You will receive a notification when action 
                is taken on your report.
              </p>
            </div>
          </section>

          {/* Appeals */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Appeals</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                If you believe your content was removed or your account was suspended in error, you can appeal 
                the decision by contacting us at <strong>appeals@stream254.co.ke</strong>. We will review your 
                appeal and respond within 5-7 business days.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Questions?</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                If you have questions about these guidelines, please contact us at 
                <strong> community@stream254.co.ke</strong>
              </p>
            </div>
          </section>

          {/* Accept Button */}
          <div className="pt-6 border-t border-gray-200">
            <Link href="/signup" className="btn-kenya-primary inline-flex items-center gap-2">
              <Heart className="h-4 w-4" />
              I Agree - Join Community
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}