import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Client Onboarding - DRSS Marketing',
  description: 'Complete your onboarding questionnaire to help us serve you better.',
}

/**
 * Public Form Layout
 * 
 * This layout provides the shell for the public questionnaire form.
 * Theme control is handled independently by the PublicFormWrapper component,
 * which applies its own dark/light mode classes. The layout itself is theme-agnostic
 * to allow the form to control its own appearance.
 */
export default function PublicFormLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* 
        Note: The actual theming happens in PublicFormWrapper which wraps
        its content in a div with the 'dark' class when in dark mode.
        This layout is intentionally minimal and theme-agnostic.
      */}
      {children}
    </>
  )
}
