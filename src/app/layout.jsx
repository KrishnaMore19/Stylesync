import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'StyleSync — Extract. Edit. Ship.',
  description: 'Transform any website into an interactive, living design system.',
  openGraph: {
    title: 'StyleSync',
    description: 'Extract design tokens from any website instantly.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="noise">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#e8e8e8',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              borderRadius: '8px',
            },
            success: {
              iconTheme: { primary: '#8b5cf6', secondary: '#080808' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#080808' },
            },
          }}
        />
      </body>
    </html>
  )
}
