import { cva,type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants=cva(
	"inline-flex items-center border px-2.5 py-0.5 font-mono text-[11.5px] font-normal transition-colors duration-150 focus:outline-none",
	{
		variants: {
			variant: {
				default:
					"border-ac text-ac",
				secondary:
					"border-br text-dim",
				destructive:
					"border-dg text-dg",
				outline: "border-br text-dim hover:border-ac hover:text-ac",
				success: "border-ac text-ac",
				warning: "border-wn text-wn",
				info: "border-br text-dim",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
	VariantProps<typeof badgeVariants> { }

function Badge ( { className,variant,...props }: BadgeProps ) {
	return (
		<div className={cn( badgeVariants( { variant } ),className )} {...props} />
	)
}

export { Badge,badgeVariants }
