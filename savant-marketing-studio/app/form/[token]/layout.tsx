import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Client Onboarding - DRSS Marketing',
  description: 'Complete your onboarding questionnaire to help us serve you better.',
}

/**
 * Public Form Layout
 * 
 * This layout provides the shell for the public questionnaire form.
 * Theme control is handled independently by the PublicFormWrapper component.
 * The inline script ensures theme is applied before React hydrates to prevent FOUC.
 * 
 * Uses separate 'questionnaire-theme' key to stay independent from main app theme.
 */
export default function PublicFormLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Prevent FOUC - set theme immediately before React hydrates */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var stored = localStorage.getItem('questionnaire-theme');
                var theme = null;
                if (stored) {
                  try {
                    theme = JSON.parse(stored);
                  } catch (e) {
                    theme = stored;
                  }
                }
                if (!theme || theme === 'system') {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(theme);
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            })();
          `,
        }}
      />
      {children}
    </>
  )
}
