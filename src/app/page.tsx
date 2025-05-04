import { cn } from "@/lib/utils";
import Link from "next/link";
import { navItems } from "./config/navigation";

export default async function Home() {
	return (
		<main className="flex bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex-col items-center justify-center relative isolate min-h-screen">
			<div className="absolute inset-0 -z-10 opacity-50 mix-blend-soft-light bg-[url('/noise.svg')] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
			<div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
				<h1
					className={cn(
						"inline-flex tracking-tight flex-col gap-1 transition text-center",
						"font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-none lg:text-[4rem]",
						"bg-gradient-to-r from-20% bg-clip-text text-transparent",
						"from-white to-gray-50",
					)}
				>
					<span>JStack</span>
				</h1>

				<p className="text-[#ececf399] text-lg/7 md:text-xl/8 text-pretty sm:text-wrap sm:text-center text-center mb-8">
					The stack for building seriously fast, lightweight and{" "}
					<span className="inline sm:block">
						end-to-end typesafe Next.js apps.
					</span>
				</p>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
					{navItems.map((item) => (
						<Link
							href={item.href}
							key={item.href}
							className="group flex flex-col p-6 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/50 hover:border-zinc-700/50 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-zinc-950/20"
						>
							<h2 className="text-xl font-medium text-white mb-2 group-hover:text-zinc-100">
								{item.label}
							</h2>
							<p className="text-zinc-400 group-hover:text-zinc-300 text-sm">
								{item.description}
							</p>
						</Link>
					))}
				</div>
			</div>
		</main>
	);
}
