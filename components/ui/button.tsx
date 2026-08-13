import { Slot } from "@radix-ui/react-slot"
import { cva,type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Console buttons are square, monospaced and flat: a filled block for the one
 * primary action on a screen, a hairline box for everything else.
 */
const buttonVariants=cva(
	"inline-flex items-center justify-center whitespace-nowrap font-mono text-[12.5px] font-normal transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ac focus-visible:ring-offset-1 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "bg-ac text-af hover:bg-ac-deep",
				destructive: "border border-dg text-dg hover:bg-dg hover:text-af",
				outline: "border border-br text-fg hover:border-ac hover:text-ac",
				secondary: "border border-br bg-ft text-fg hover:bg-transparent hover:border-ac",
				ghost: "text-dim hover:bg-ft hover:text-fg",
				link: "text-ac underline-offset-4 hover:underline hover:text-ac-deep",
				glow: "bg-ac text-af hover:bg-ac-deep",
				success: "bg-ac text-af hover:bg-ac-deep",
				warning: "border border-wn text-wn hover:bg-wn hover:text-af",
				info: "border border-br text-dim hover:border-ac hover:text-ac",
				purple: "bg-ac text-af hover:bg-ac-deep",
				orange: "border border-wn text-wn hover:bg-wn hover:text-af",
				teal: "border border-br text-dim hover:border-ac hover:text-ac",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 px-3",
				lg: "h-11 px-8",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
)

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
	VariantProps<typeof buttonVariants> {
	asChild?: boolean
	/** Keyboard shortcut printed at the right of the label, dimmed. */
	shortcut?: string
}

const Button=React.forwardRef<HTMLButtonElement,ButtonProps>(
	( { className,variant,size,asChild=false,shortcut,children,...props },ref ) => {
		const Comp=asChild? Slot:"button"
		return (
			<Comp
				className={cn( buttonVariants( { variant,size,className } ) )}
				ref={ref}
				{...props}
			>
				{asChild? children:(
					<>
						{children}
						{shortcut&&<span className="ml-3 opacity-55">{shortcut}</span>}
					</>
				)}
			</Comp>
		)
	}
)
Button.displayName="Button"

export { Button,buttonVariants }
