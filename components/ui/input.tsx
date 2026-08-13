import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input=React.forwardRef<HTMLInputElement,InputProps>(
	( { className,type,...props },ref ) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-11 w-full border border-br bg-transparent px-3 py-2 font-mono text-[13px] text-fg placeholder:text-dim file:border-0 file:bg-transparent file:text-[13px] focus-visible:outline-none focus-visible:border-ac disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150",
					className
				)}
				ref={ref}
				{...props}
			/>
		)
	}
)
Input.displayName="Input"

export { Input }
