'use client'

import { BrandMark } from '@/components/ui/brand-mark'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'
import { signOut,useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname,useRouter } from 'next/navigation'
import { useEffect,useRef,useState } from 'react'

interface SidebarProps {
	className?: string
}

interface NavItem {
	label: string
	href: string
	/** The key that jumps here. Shown at the right of the row. */
	key: string
}

const navItems: NavItem[]=[
	{ label: 'pipeline',href: '/dashboard',key: '1' },
	{ label: 'discover',href: '/dashboard/discover',key: '2' },
	{ label: 'applications',href: '/dashboard/applications',key: '3' },
	{ label: 'companies',href: '/dashboard/companies',key: '4' },
	{ label: 'calendar',href: '/dashboard/calendar',key: '5' },
	{ label: 'analytics',href: '/dashboard/analytics',key: '6' },
	{ label: 'documents',href: '/dashboard/documents',key: '7' },
	{ label: 'contacts',href: '/dashboard/contacts',key: '8' },
	{ label: 'ai tools',href: '/dashboard/ai-tools',key: '9' },
	{ label: 'quick actions',href: '/dashboard/quick-actions',key: '0' },
]

/** The shortcuts worth naming differ per screen. */
const hintsByRoute: Record<string,[ string,string ][]>={
	'/dashboard': [ [ 'N','new application' ],[ '/','search' ],[ 'G','go to stage' ] ],
	'/dashboard/applications': [ [ '/','filter' ],[ 'E','edit row' ],[ '↵','expand' ] ],
	'/dashboard/calendar': [ [ 'T','today' ],[ '← →','month' ] ],
	'/dashboard/discover': [ [ '/','filter' ],[ 'S','save job' ] ],
	'/dashboard/companies': [ [ 'E','edit company' ] ],
	'/dashboard/contacts': [ [ '/','search' ] ],
	'/dashboard/analytics': [ [ 'R','refresh' ] ],
	'/dashboard/documents': [ [ 'U','upload' ],[ 'V','view' ] ],
	'/dashboard/ai-tools': [ [ '⌘⏎','run tool' ] ],
	'/dashboard/quick-actions': [ [ '/','filter commands' ] ],
}

const defaultHints: [ string,string ][]=[ [ '1-0','jump' ],[ 'N','new application' ] ]

export function Sidebar ( { className }: SidebarProps ) {
	const pathname=usePathname()
	const router=useRouter()
	const { data: session }=useSession()
	const { theme,toggle }=useTheme()
	const [ isAccountOpen,setIsAccountOpen ]=useState( false )
	const accountRef=useRef<HTMLDivElement>( null )

	const hints=hintsByRoute[ pathname ]??defaultHints

	// Number keys jump between sections, as the row hints promise.
	useEffect( () => {
		const onKeyDown=( event: KeyboardEvent ) => {
			if ( event.metaKey||event.ctrlKey||event.altKey ) return

			const target=event.target as HTMLElement|null
			if ( target?.isContentEditable ) return
			if ( target&&/^(INPUT|TEXTAREA|SELECT)$/.test( target.tagName ) ) return

			const item=navItems.find( nav => nav.key===event.key )
			if ( !item ) return

			event.preventDefault()
			router.push( item.href )
		}

		window.addEventListener( 'keydown',onKeyDown )
		return () => window.removeEventListener( 'keydown',onKeyDown )
	},[ router ] )

	useEffect( () => {
		if ( !isAccountOpen ) return

		const onPointerDown=( event: MouseEvent ) => {
			if ( accountRef.current&&!accountRef.current.contains( event.target as Node ) ) {
				setIsAccountOpen( false )
			}
		}

		document.addEventListener( 'mousedown',onPointerDown )
		return () => document.removeEventListener( 'mousedown',onPointerDown )
	},[ isAccountOpen ] )

	const account=session?.user?.email??session?.user?.name??'not signed in'

	return (
		<div
			className={cn(
				'flex w-[196px] flex-none flex-col gap-7 border-r border-br bg-pn px-[18px] py-6',
				className
			)}
		>
			<Link href="/dashboard" className="flex items-center gap-[9px] text-fg no-underline">
				<BrandMark />
				<span className="font-medium">codeniwork</span>
			</Link>

			<nav className="flex flex-col">
				{navItems.map( item => {
					const isActive=pathname===item.href
					return (
						<Link
							key={item.href}
							href={item.href}
							aria-current={isActive? 'page':undefined}
							className={cn(
								'-mx-[10px] flex justify-between px-[10px] py-2 text-[12.5px] no-underline transition-colors',
								isActive
									? 'bg-ac text-af'
									:'text-dim hover:text-fg'
							)}
						>
							<span>{item.label}</span>
							<span className={isActive? 'opacity-55':'opacity-50'}>{item.key}</span>
						</Link>
					)
				} )}
			</nav>

			<div className="mt-auto flex flex-col gap-[13px]">
				<div className="text-[11px] leading-[1.8] text-dim opacity-80">
					{hints.map( ( [ key,description ] ) => (
						<div key={key}>
							{key}&nbsp;&nbsp;{description}
						</div>
					) )}
				</div>

				<div className="h-px bg-br" />

				<button
					type="button"
					onClick={toggle}
					className="flex justify-between text-left text-[11px] text-dim transition-colors hover:text-fg"
				>
					<span>theme</span>
					<span>{theme==='dark'? 'dark':'light'}</span>
				</button>

				<div className="relative" ref={accountRef}>
					<button
						type="button"
						onClick={() => setIsAccountOpen( open => !open )}
						className="w-full truncate text-left text-[11.5px] text-dim transition-colors hover:text-fg"
						title={account}
					>
						{account}
					</button>

					{isAccountOpen&&(
						<div className="absolute bottom-full left-0 z-50 mb-2 w-[168px] border border-br bg-pn">
							<button
								type="button"
								onClick={() => {
									setIsAccountOpen( false )
									router.push( '/profile' )
								}}
								className="block w-full px-3 py-2.5 text-left text-[12px] text-dim transition-colors hover:bg-ft hover:text-fg"
							>
								profile
							</button>
							{session?.user? (
								<button
									type="button"
									onClick={() => signOut( { callbackUrl: '/' } )}
									className="block w-full border-t border-br px-3 py-2.5 text-left text-[12px] text-dim transition-colors hover:bg-ft hover:text-fg"
								>
									sign out
								</button>
							):(
								<button
									type="button"
									onClick={() => {
										setIsAccountOpen( false )
										router.push( '/auth/signin' )
									}}
									className="block w-full border-t border-br px-3 py-2.5 text-left text-[12px] text-dim transition-colors hover:bg-ft hover:text-fg"
								>
									sign in
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
