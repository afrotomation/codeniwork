import { Sidebar } from '@/components/ui/sidebar'

export default function DashboardLayout ( {
	children,
}: {
	children: React.ReactNode
} ) {
	return (
		<div className="flex h-screen bg-bg text-fg">
			<Sidebar className="h-screen" />
			<main className="flex-1 overflow-auto px-8 pt-7 pb-8">
				{children}
			</main>
		</div>
	)
}
