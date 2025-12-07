'use client'

import { useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const PinModal = dynamic(() => import('@/components/pin-modal'), { ssr: false })

export default function LandingPage() {
  const [formStep, setFormStep] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    revenue: '',
    needs: [] as string[],
    timeline: '',
  })
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleApply = () => {
    setShowForm(true)
    setFormStep(1)
    // Scroll to form section
    setTimeout(() => {
      document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleNeedToggle = (need: string) => {
    setFormData(prev => ({
      ...prev,
      needs: prev.needs.includes(need)
        ? prev.needs.filter(n => n !== need)
        : [...prev.needs, need]
    }))
  }

  const nextStep = () => setFormStep(prev => prev + 1)
  const prevStep = () => setFormStep(prev => prev - 1)

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-x-hidden">
      
      {/* ==================== SECTION 1: HERO ==================== */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-20 relative">
        {/* Nav */}
        <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
          <span className="text-xl font-bold">DRSS</span>
          <button 
            onClick={() => setShowPinModal(true)}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Admin
          </button>
        </nav>

        <div className="max-w-lg mx-auto text-center md:max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
            Unlimited marketing assets.
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight text-gray-500 mb-6">
            One flat monthly fee.
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-md mx-auto">
            For Kingdom business owners who refuse to compromise.
          </p>
          
          <button
            onClick={handleApply}
            className="w-full md:w-auto px-8 py-4 bg-[#FF5A5F] text-white font-semibold rounded-xl text-lg hover:bg-[#E54A4F] transition-colors"
          >
            Apply Now
          </button>
        </div>

        {/* Scroll indicator */}
        <button 
          onClick={() => scrollToSection('work')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 flex flex-col items-center gap-2 hover:text-white transition-colors"
        >
          <span className="text-sm">See the work</span>
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </section>

      {/* ==================== SECTION 2: PROOF WALL ==================== */}
      <section id="work" className="py-20 bg-white text-gray-900">
        <div className="px-6 mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">
            This is what we build.
          </h2>
          <p className="text-gray-500 text-center">Swipe to explore →</p>
            </div>
            
        {/* Horizontal scroll gallery */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-6 pb-4" style={{ width: 'max-content' }}>
            {[
              { title: 'Landing Pages', image: '/portfolio/landing-page.jpg', desc: 'High-converting pages that capture leads' },
              { title: 'Email Campaigns', image: '/portfolio/email.jpg', desc: 'Sequences that nurture and sell' },
              { title: 'Ad Creatives', image: '/portfolio/ads.jpg', desc: 'Scroll-stopping ads that convert' },
              { title: 'Sales Funnels', image: '/portfolio/funnel.jpg', desc: 'End-to-end conversion systems' },
              { title: 'Social Graphics', image: '/portfolio/social.jpg', desc: 'Content that builds authority' },
              { title: 'Lead Magnets', image: '/portfolio/leadmagnet.jpg', desc: 'Resources that attract buyers' },
            ].map((item, i) => (
              <div 
                key={i}
                className="flex-shrink-0 w-72 md:w-80 bg-gray-100 rounded-2xl overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow"
              >
                {/* Placeholder for portfolio image */}
                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">[ {item.title} mockup ]</span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
            </div>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-500 mt-8 px-6">
          48-hour turnaround. Unlimited revisions.
        </p>
      </section>

      {/* ==================== SECTION 3: BEFORE/AFTER ==================== */}
      <section className="py-20 bg-[#0A0A0B]">
        <div className="px-6 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            The transformation.
            </h2>

          {/* Before/After cards */}
          <div className="space-y-6">
            {/* Before */}
            <div className="relative">
              <span className="absolute -top-3 left-4 bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">
                BEFORE
              </span>
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 text-sm">[ Generic template screenshot ]</span>
          </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-[#FF5A5F] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>

            {/* After */}
            <div className="relative">
              <span className="absolute -top-3 left-4 bg-[#FF5A5F] text-white text-xs px-3 py-1 rounded-full">
                AFTER
              </span>
              <div className="bg-gray-900 rounded-2xl p-6 border border-[#FF5A5F]/30">
                <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-sm">[ Beautiful redesign mockup ]</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 mt-8">
            72 hours. No calls. No scope creep.
          </p>
        </div>
      </section>

      {/* ==================== SECTION 4: HOW IT WORKS ==================== */}
      <section className="py-20 bg-white text-gray-900">
        <div className="px-6 max-w-lg mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Dead simple.
          </h2>

          <div className="space-y-6">
            {[
              { num: '1', title: 'Subscribe', desc: 'Pick your plan. Cancel anytime. No contracts, no BS.' },
              { num: '2', title: 'Request', desc: 'Submit unlimited requests. We tackle them one by one.' },
              { num: '3', title: 'Receive', desc: 'Get deliverables in 48 hours. Revise until you love it.' },
            ].map((step, i) => (
              <div 
                key={i}
                className="flex gap-4 p-6 bg-gray-50 rounded-2xl"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-[#FF5A5F] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SECTION 5: WHAT'S INCLUDED ==================== */}
      <section className="py-20 bg-gray-50 text-gray-900">
        <div className="px-6 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Everything you need.
          </h2>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {[
              'Landing Pages',
              'Email Campaigns',
              'Social Graphics',
              'Ad Creatives',
              'Brand Guidelines',
              'Sales Funnels',
              'Lead Magnets',
              'Presentation Decks',
              'Website Pages',
              'Blog Graphics',
            ].map((item, i) => (
              <div 
                key={i}
                className="flex items-center gap-3 p-4 bg-white rounded-xl"
              >
                <svg className="w-5 h-5 text-[#FF5A5F] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm md:text-base">{item}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 mt-8">
            + anything else marketing. Just ask.
              </p>
            </div>
      </section>

      {/* ==================== SECTION 6: THE FOUNDER ==================== */}
      <section className="py-20 bg-[#0A0A0B]">
        <div className="px-6 max-w-lg mx-auto text-center">
          {/* Photo */}
          <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 rounded-full overflow-hidden border-4 border-gray-800 relative">
            <Image
              src="/maurice-mcgowan.jpg"
              alt="Maurice McGowan, Founder of DRSS"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 128px, 160px"
            />
          </div>

          <blockquote className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed">
            &ldquo;I built this because I was tired of watching Kingdom businesses get burned by agencies who either couldn&apos;t deliver or didn&apos;t share their values.&rdquo;
          </blockquote>

          <div className="text-[#FF5A5F] font-medium">
            Maurice McGowan
          </div>
          <div className="text-gray-500 text-sm">
            Founder, DRSS
          </div>
        </div>
      </section>

      {/* ==================== SECTION 7: PRICING ==================== */}
      <section id="pricing" className="py-20 bg-white text-gray-900">
        <div className="px-6 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Transparent pricing.
          </h2>
          <p className="text-gray-500 text-center mb-12">
            No hidden fees. No surprises.
          </p>

          {/* Pricing cards - horizontal scroll on mobile */}
          <div className="overflow-x-auto scrollbar-hide md:overflow-visible md:flex md:justify-center">
            <div className="flex gap-4 md:gap-6 px-2 md:px-0" style={{ width: 'max-content' }}>
              
              {/* STARTER */}
              <div className="flex-shrink-0 w-72 md:w-80 bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="text-[#FF5A5F] font-bold text-sm tracking-wide mb-4">
                  STARTER
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$2,997</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm">
                  {['1 request at a time', 'Unlimited requests total', '48-hour turnaround', 'Unlimited revisions', 'Pause or cancel anytime'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#FF5A5F]">•</span>
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={handleApply}
                  className="w-full py-3 bg-[#FF5A5F] text-white font-semibold rounded-xl hover:bg-[#E54A4F] transition-colors"
                >
                  Apply Now
                </button>
              </div>

              {/* PRO - Featured */}
              <div className="flex-shrink-0 w-72 md:w-80 bg-gray-900 text-white rounded-2xl p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#FF5A5F] text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
                <div className="text-[#FF5A5F] font-bold text-sm tracking-wide mb-4">
                  PRO
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$4,997</span>
                  <span className="text-gray-400">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm">
                  {['2 requests at a time', 'Unlimited requests total', '48-hour turnaround', 'Unlimited revisions', 'Priority support', 'Pause or cancel anytime'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#FF5A5F]">•</span>
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={handleApply}
                  className="w-full py-3 bg-[#FF5A5F] text-white font-semibold rounded-xl hover:bg-[#E54A4F] transition-colors"
                >
                  Apply Now
                </button>
            </div>

              {/* ENTERPRISE */}
              <div className="flex-shrink-0 w-72 md:w-80 bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="text-[#FF5A5F] font-bold text-sm tracking-wide mb-4">
                  ENTERPRISE
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$7,997</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm">
                  {['3 requests at a time', 'Unlimited requests total', '24-hour turnaround', 'Unlimited revisions', 'Dedicated Slack channel', 'Strategy calls included', 'Pause or cancel anytime'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#FF5A5F]">•</span>
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={handleApply}
                  className="w-full py-3 bg-[#FF5A5F] text-white font-semibold rounded-xl hover:bg-[#E54A4F] transition-colors"
                >
                  Apply Now
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 8: FAQ ==================== */}
      <section className="py-20 bg-[#0A0A0B]">
        <div className="px-6 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Quick answers.
            </h2>

          <div className="space-y-2">
            {[
              { q: 'How fast will I receive my deliverables?', a: 'Most requests are completed in 48 hours. Complex projects like full funnels may take longer—we\'ll always give you an estimate upfront.' },
              { q: 'What if I don\'t like the result?', a: 'We revise until you\'re happy. Unlimited revisions are included in every plan. No extra charge, no attitude.' },
              { q: 'Can I really pause anytime?', a: 'Yes. Billing is monthly. Pause when you need to, resume when you\'re ready. No penalties, no guilt trips, no questions asked.' },
              { q: 'What counts as "one request"?', a: 'One deliverable = one request. A landing page is one request. A set of 5 social graphics is one request. We keep it simple.' },
              { q: 'Do you only work with Christians?', a: 'We work with businesses that honor God and serve people with integrity. If that\'s you, we\'re probably a fit.' },
            ].map((faq, i) => (
              <div key={i} className="border-b border-gray-800 last:border-0">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full py-5 flex items-center justify-between text-left"
                >
                  <span className="text-lg pr-4">{faq.q}</span>
                  <span className={`text-[#FF5A5F] text-2xl transition-transform duration-200 ${expandedFaq === i ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${expandedFaq === i ? 'max-h-48 pb-5' : 'max-h-0'}`}>
                  <p className="text-gray-400 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SECTION 9: APPLICATION FORM ==================== */}
      <section id="apply" className="py-20 bg-white text-gray-900">
        <div className="px-6 max-w-lg mx-auto">
          
          {!showForm ? (
            // Pre-form state
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to apply?
              </h2>
              <p className="text-gray-600 mb-8">
                Takes 2 minutes. No commitment.
              </p>
              <button
                onClick={handleApply}
                className="w-full md:w-auto px-8 py-4 bg-[#FF5A5F] text-white font-semibold rounded-xl text-lg hover:bg-[#E54A4F] transition-colors"
              >
                Start Application
              </button>
            </div>
          ) : (
            // Multi-step form
            <div>
              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Step {formStep} of 5</span>
                  <span>{Math.round((formStep / 5) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#FF5A5F] transition-all duration-300"
                    style={{ width: `${(formStep / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step 1: Business Name */}
              {formStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">What&apos;s your business name?</h3>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Acme Inc."
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl text-lg focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#FF5A5F]/20 outline-none transition-all"
                    autoFocus
                  />
                  <button
                    onClick={nextStep}
                    disabled={!formData.businessName}
                    className="w-full py-4 bg-[#FF5A5F] text-white font-semibold rounded-xl text-lg hover:bg-[#E54A4F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Step 2: Business Type */}
              {formStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">What do you sell?</h3>
                  <div className="space-y-3">
                    {['Products', 'Services', 'Courses / Info Products', 'Coaching / Consulting', 'Other'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, businessType: type })}
                        className={`w-full px-4 py-4 border rounded-xl text-left transition-all ${
                          formData.businessType === type
                            ? 'border-[#FF5A5F] bg-[#FF5A5F]/5 text-[#FF5A5F]'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={prevStep}
                      className="px-6 py-4 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!formData.businessType}
                      className="flex-1 py-4 bg-[#FF5A5F] text-white font-semibold rounded-xl text-lg hover:bg-[#E54A4F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Revenue */}
              {formStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">What&apos;s your monthly revenue?</h3>
                  <div className="space-y-3">
                    {['Under $10K', '$10K - $50K', '$50K - $100K', '$100K - $500K', '$500K+'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setFormData({ ...formData, revenue: range })}
                        className={`w-full px-4 py-4 border rounded-xl text-left transition-all ${
                          formData.revenue === range
                            ? 'border-[#FF5A5F] bg-[#FF5A5F]/5 text-[#FF5A5F]'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={prevStep}
                      className="px-6 py-4 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!formData.revenue}
                      className="flex-1 py-4 bg-[#FF5A5F] text-white font-semibold rounded-xl text-lg hover:bg-[#E54A4F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Needs */}
              {formStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">What do you need most?</h3>
                  <p className="text-gray-500">Select all that apply</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Landing pages', 'Email campaigns', 'Ad creatives', 'Sales funnels', 'Brand refresh', 'Social content', 'Lead magnets', 'Other'].map((need) => (
                      <button
                        key={need}
                        onClick={() => handleNeedToggle(need)}
                        className={`px-4 py-3 border rounded-xl text-sm transition-all ${
                          formData.needs.includes(need)
                            ? 'border-[#FF5A5F] bg-[#FF5A5F]/5 text-[#FF5A5F]'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {need}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={prevStep}
                      className="px-6 py-4 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={formData.needs.length === 0}
                      className="flex-1 py-4 bg-[#FF5A5F] text-white font-semibold rounded-xl text-lg hover:bg-[#E54A4F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Timeline */}
              {formStep === 5 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">When do you want to start?</h3>
                  <div className="space-y-3">
                    {['Immediately', 'Within 2 weeks', 'Within a month', 'Just exploring'].map((timeline) => (
                      <button
                        key={timeline}
                        onClick={() => setFormData({ ...formData, timeline })}
                        className={`w-full px-4 py-4 border rounded-xl text-left transition-all ${
                          formData.timeline === timeline
                            ? 'border-[#FF5A5F] bg-[#FF5A5F]/5 text-[#FF5A5F]'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {timeline}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={prevStep}
                      className="px-6 py-4 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!formData.timeline}
                      className="flex-1 py-4 bg-[#FF5A5F] text-white font-semibold rounded-xl text-lg hover:bg-[#E54A4F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Book Your Call →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 6: Calendar */}
              {formStep === 6 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#FF5A5F]/10 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#FF5A5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">You&apos;re in.</h3>
                    <p className="text-gray-600">Pick a time that works for you.</p>
            </div>
            
                  {/* Calendar embed placeholder */}
                  <div className="bg-gray-100 rounded-2xl p-8 text-center min-h-[400px] flex items-center justify-center">
                    <div className="text-gray-500">
                      <p className="mb-2">[ Calendly / Cal.com embed goes here ]</p>
                      <p className="text-sm">15-minute intro call</p>
              </div>
            </div>
            
                  <p className="text-center text-gray-500 text-sm">
                    No pitch. Just a fit check.
                  </p>
              </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ==================== SECTION 10: FINAL CTA ==================== */}
      <section className="py-20 bg-[#0A0A0B]">
        <div className="px-6 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Marketing that works AND honors God.
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Stop choosing between competence and conviction.
          </p>
          <button
            onClick={handleApply}
            className="w-full md:w-auto px-10 py-5 bg-[#FF5A5F] text-white font-semibold rounded-xl text-lg hover:bg-[#E54A4F] transition-colors"
          >
            Apply Now
          </button>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="py-8 bg-[#0A0A0B] border-t border-gray-800">
        <div className="px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2025 DRSS Marketing. All rights reserved.
            </p>
          <button 
            onClick={() => setShowPinModal(true)}
            className="text-gray-500 text-sm hover:text-white transition-colors"
          >
            Admin Login
          </button>
        </div>
      </footer>

      {/* ==================== GLOBAL STYLES ==================== */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        
        /* Hide scrollbar for horizontal scroll galleries */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Smooth transitions */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Input focus styles */
        input:focus {
          outline: none;
        }
      `}</style>
      
      {/* PIN Modal */}
      <PinModal open={showPinModal} onClose={() => setShowPinModal(false)} />
    </div>
  )
}
