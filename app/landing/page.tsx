import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-xl font-bold">DRSS</div>
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 rounded-full bg-[#F4C430] bg-opacity-10 border border-[#F4C430] text-[#F4C430] text-sm font-semibold">
                AI Business Transformation
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Custom AI Agents
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A5F] to-[#F4C430]">
                Built For Your Business
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed">
              Get AI agents trained on your company data, complete funnel builds, 
              market research, and internal automation. We don&apos;t just create content—we 
              transform how your business operates.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#audit"
                className="inline-block bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-lg shadow-[#FF5A5F]/20"
              >
                Get Your Free AI Audit
              </a>
              <a
                href="#services"
                className="inline-block bg-white bg-opacity-5 hover:bg-opacity-10 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all border border-gray-700"
              >
                See What We Build
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* What We Build Section */}
      <div id="services" className="border-b border-gray-800 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What We Build For You
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Complete AI transformation, not just templates
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service 1 */}
            <div className="bg-white bg-opacity-5 backdrop-blur rounded-xl p-8 border border-gray-800 hover:border-[#FF5A5F] transition-all group">
              <div className="h-12 w-12 bg-[#FF5A5F] bg-opacity-10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 text-[#FF5A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Custom AI Agents</h3>
              <p className="text-gray-400 leading-relaxed">
                AI trained specifically on your business data, processes, and goals. Make decisions, 
                write SOPs, analyze financials, optimize operations—all based on YOUR company&apos;s reality.
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-white bg-opacity-5 backdrop-blur rounded-xl p-8 border border-gray-800 hover:border-[#F4C430] transition-all group">
              <div className="h-12 w-12 bg-[#F4C430] bg-opacity-10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 text-[#F4C430]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Complete Funnels</h3>
              <p className="text-gray-400 leading-relaxed">
                Landing pages, email sequences, ad campaigns, and sales funnels. Built from scratch, 
                optimized for conversion, and designed to match your brand perfectly.
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-white bg-opacity-5 backdrop-blur rounded-xl p-8 border border-gray-800 hover:border-[#FF5A5F] transition-all group">
              <div className="h-12 w-12 bg-[#FF5A5F] bg-opacity-10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 text-[#FF5A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Market Research</h3>
              <p className="text-gray-400 leading-relaxed">
                Deep competitive analysis, target market insights, positioning strategy. Know exactly 
                where you stand and how to win in your market.
              </p>
            </div>

            {/* Service 4 */}
            <div className="bg-white bg-opacity-5 backdrop-blur rounded-xl p-8 border border-gray-800 hover:border-[#F4C430] transition-all group">
              <div className="h-12 w-12 bg-[#F4C430] bg-opacity-10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 text-[#F4C430]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Internal Automation</h3>
              <p className="text-gray-400 leading-relaxed">
                AI-powered SOPs, financial analysis, employee optimization, decision support. Transform 
                your internal operations with intelligent automation.
              </p>
            </div>

            {/* Service 5 */}
            <div className="bg-white bg-opacity-5 backdrop-blur rounded-xl p-8 border border-gray-800 hover:border-[#FF5A5F] transition-all group">
              <div className="h-12 w-12 bg-[#FF5A5F] bg-opacity-10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 text-[#FF5A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Project Dashboard</h3>
              <p className="text-gray-400 leading-relaxed">
                Track everything in one place. See what&apos;s in progress, what&apos;s done, communicate async. 
                Full transparency on all deliverables.
              </p>
            </div>

            {/* Service 6 */}
            <div className="bg-white bg-opacity-5 backdrop-blur rounded-xl p-8 border border-gray-800 hover:border-[#F4C430] transition-all group">
              <div className="h-12 w-12 bg-[#F4C430] bg-opacity-10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 text-[#F4C430]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Content Generation</h3>
              <p className="text-gray-400 leading-relaxed">
                Landing pages, ad copy, email campaigns, blog posts. AI-generated and framework-driven. 
                This is just one piece of what we do.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="border-b border-gray-800 py-24 bg-gradient-to-b from-transparent to-[#FF5A5F]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-400">
              From audit to AI transformation in 4 steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-[#FF5A5F] text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Free AI Audit</h3>
              <p className="text-gray-400">
                Tell us about your business. We analyze where AI can transform your operations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 bg-[#F4C430] text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Get Sample Work</h3>
              <p className="text-gray-400">
                We deliver a free sample—real AI-generated content or strategy you can use immediately.
              </p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 bg-[#FF5A5F] text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Build Custom AI</h3>
              <p className="text-gray-400">
                We train AI agents on your business data and start building your complete solution.
              </p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 bg-[#F4C430] text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">Transform Operations</h3>
              <p className="text-gray-400">
                Track everything in your dashboard. See results. Scale with AI doing the heavy lifting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div id="audit" className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to See What AI Can Do
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A5F] to-[#F4C430]">
              For Your Business?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Get a free AI audit + sample work. No charge. No obligation. 
            See exactly how we&apos;ll transform your operations.
          </p>
          <a
            href="/audit-form"
            className="inline-block bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white px-12 py-5 rounded-lg text-xl font-semibold transition-all shadow-2xl shadow-[#FF5A5F]/30"
          >
            Get Your Free AI Audit
          </a>
          <p className="mt-6 text-sm text-gray-500">
            Takes 3 minutes. We&apos;ll respond within 24 hours.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 text-sm">
              © 2025 DRSS Marketing Agency OS. All rights reserved.
            </p>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-white transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

