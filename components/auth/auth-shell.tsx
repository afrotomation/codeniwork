import { BrandMark } from '@/components/ui/brand-mark'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface AuthShellProps {
	/** The context column: what the product is, or where the user is in signing up. */
	aside: ReactNode
	children: ReactNode
}

/**
 * Both auth screens are the same two columns: context on the left, the form on
 * the right. Below lg the context column drops — it explains, it does not act.
 */
export function AuthShell ( { aside,children }: AuthShellProps ) {
	return (
		<div className="grid min-h-screen grid-cols-1 bg-bg text-fg lg:grid-cols-2">
			<div className="hidden flex-col border-r border-br px-8 py-[34px] lg:flex">
				<Link href="/" className="flex items-center gap-2.5 text-fg no-underline">
					<BrandMark />
					<span className="font-medium">codeniwork</span>
				</Link>
				{aside}
			</div>

			<div className="flex flex-col px-8 py-[34px]">{children}</div>
		</div>
	)
}
