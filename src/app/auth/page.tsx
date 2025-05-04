import { cn } from "@/lib/utils";
import { AuthDemo } from "./auth";

export default function Auth() {
	return (
		<main className="flex bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex-col items-center justify-center relative isolate">
			<div className="absolute inset-0 -z-10 opacity-50 mix-blend-soft-light bg-[url('/noise.svg')] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
			<div className="container flex flex-col items-center justify-center gap-6 px-4 py-16">
				<h1
					className={cn(
						"inline-flex tracking-tight flex-col gap-1 transition text-center",
						"font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-none lg:text-[4rem]",
						"bg-gradient-to-r from-20% bg-clip-text text-transparent",
						"from-white to-gray-50",
					)}
				>
					<span>Authentication</span>
				</h1>

				<p className="text-[#ececf399] text-lg/7 md:text-xl/8 text-pretty sm:text-wrap sm:text-center text-center mb-8">
					Learn about the Auth Middleware capabilities.
				</p>

				<AuthDemo />
			</div>
		</main>
	);
}
