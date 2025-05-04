"use client";

import { cn } from "@/lib/utils";

interface SimpleSwitchProps {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	className?: string;
}

export function SimpleSwitch({
	checked,
	onCheckedChange,
	className,
}: SimpleSwitchProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onCheckedChange(!checked)}
			className={cn(
				"relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 backdrop-blur-md",
				checked
					? "bg-gradient-to-r from-zinc-500/40 to-zinc-400/40 border border-zinc-500/30"
					: "bg-zinc-800/50 border border-zinc-700/30",
				className,
			)}
		>
			<span
				className={cn(
					"pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-all duration-300",
					checked
						? "translate-x-6 bg-zinc-100/90 shadow-zinc-300/20"
						: "translate-x-1 bg-zinc-600/90",
				)}
			/>
			<span
				className={cn(
					"absolute inset-0 rounded-full transition-opacity duration-300",
					checked
						? "opacity-100 bg-gradient-to-r from-zinc-600/5 to-zinc-300/5 shadow-inner"
						: "opacity-0",
				)}
			/>
		</button>
	);
}
