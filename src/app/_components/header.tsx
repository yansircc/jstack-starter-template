"use client";

import {
	SignInButton,
	SignUpButton,
	SignedIn,
	SignedOut,
	UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "../config/navigation";

export const Header = () => {
	return (
		<header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-zinc-950/80 border-b border-zinc-800/20 transition-all">
			<div className="container mx-auto flex items-center justify-between h-16 px-4">
				<div className="flex items-center gap-8">
					<TextLogo />
					<Nav />
				</div>

				<div className="flex items-center gap-3">
					<SignedOut>
						<SignInButton mode="modal">
							<button
								type="button"
								className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors rounded-md hover:bg-zinc-800/50"
							>
								登录
							</button>
						</SignInButton>
						<SignUpButton mode="modal">
							<button
								type="button"
								className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-zinc-200 to-zinc-300 hover:from-zinc-100 hover:to-zinc-200 text-zinc-900 rounded-md transition-all duration-200 shadow-sm hover:shadow"
							>
								注册
							</button>
						</SignUpButton>
					</SignedOut>
					<SignedIn>
						<UserButton
							appearance={{
								elements: {
									userButtonAvatarBox:
										"w-9 h-9 border-2 border-zinc-700/50 hover:border-zinc-500 transition-colors",
								},
							}}
						/>
					</SignedIn>
				</div>
			</div>
		</header>
	);
};

const Nav = () => {
	const pathname = usePathname();

	return (
		<nav className="hidden md:flex items-center space-x-1">
			{navItems.map((item) => {
				const isActive = pathname === item.href;
				return (
					<Link
						key={item.href}
						href={item.href}
						className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
							isActive
								? "bg-zinc-800/80 text-white"
								: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
						}`}
					>
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
};

const TextLogo = () => {
	return (
		<Link href="/" className="flex items-center space-x-2">
			<span className="text-xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 text-transparent bg-clip-text">
				JStack
			</span>
		</Link>
	);
};
