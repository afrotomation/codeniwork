interface BrandMarkProps {
	size?: number
	className?: string
}

/** The console's mark. Fills come from the theme, so it flips with everything else. */
export function BrandMark ( { size=18,className }: BrandMarkProps ) {
	return (
		<svg
			viewBox="0 0 32 32"
			width={size}
			height={size}
			className={`block flex-none ${className??''}`}
			aria-hidden="true"
		>
			<rect width="32" height="32" rx="6" fill="var(--ac)" />
			<path d="M8 10h16v2H8zm0 4h16v10H8z" fill="var(--af)" />
			<path d="M12 8h8v2h-8z" fill="var(--af)" />
		</svg>
	)
}
