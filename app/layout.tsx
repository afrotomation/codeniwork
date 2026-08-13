import { AnalyticsProvider } from '@/components/analytics-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'
import { IBM_Plex_Mono,Sora } from 'next/font/google'
import './globals.css'

const plexMono=IBM_Plex_Mono( {
	subsets: [ 'latin' ],
	weight: [ '400','500','600' ],
	variable: '--font-plex-mono',
	display: 'swap',
} )

const sora=Sora( {
	subsets: [ 'latin' ],
	weight: [ '200','300','400','500' ],
	variable: '--font-sora',
	display: 'swap',
} )

export const metadata: Metadata={
	title: 'CodeniWork — Job Application Tracker',
	description: 'Track your career with CodeniWork — a console for the job search.',
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

/* Runs before first paint so a stored preference never flashes the other theme. */
const themeInit=`(function(){try{var t=localStorage.getItem('codeniwork-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})()`

export default function RootLayout ( {
	children,
}: {
	children: React.ReactNode
} ) {
	return (
		<html lang="en" className={`h-full ${plexMono.variable} ${sora.variable}`} suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeInit }} />
				<script defer src="/a/script.js" data-host-url="/a" data-website-id="fa178569-fd4b-4502-b97f-232884172e42"></script>
			</head>
			<body className="h-full font-mono" suppressHydrationWarning={true}>
				<AuthProvider>
					<AnalyticsProvider>
						{children}
					</AnalyticsProvider>
					<Toaster />
				</AuthProvider>
			</body>
		</html>
	)
}
