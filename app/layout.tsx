import { AnalyticsProvider } from '@/components/analytics-provider'
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter=Inter( { subsets: [ 'latin' ] } )

export const metadata: Metadata={
	title: 'CodeniWork - Job Application Tracker',
	description: 'Track your career with CodeniWork - a beautiful, modern job application tracker inspired by Clean My Mac',
	keywords: [ 'codeniwork','job tracker','application tracker','career management','job search' ],
	authors: [ { name: 'CodeniWork Team' } ],
	manifest: '/manifest.json',
	icons: {
		icon: [
			{ url: '/favicon.svg',type: 'image/svg+xml' }
		],
		apple: '/apple-touch-icon.svg',
	},
}

export const viewport={
	width: 'device-width',
	initialScale: 1,
}

export default function RootLayout ( {
	children,
}: {
	children: React.ReactNode
} ) {
	return (
		<html lang="en" className="h-full">
      <head>
        <script defer src="/a/script.js" data-host-url="/a" data-website-id="fa178569-fd4b-4502-b97f-232884172e42"></script>
      </head>
			<body className={`${inter.className} h-full`} suppressHydrationWarning={true}>
					<AnalyticsProvider>
						{children}
					</AnalyticsProvider>
					<Toaster />
			</body>
		</html>
	)
}
