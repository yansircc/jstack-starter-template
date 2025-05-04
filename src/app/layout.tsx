import type { Metadata } from "next";
import { Providers } from "./components/providers";
import "./globals.css";
import { Header } from "./components/header";

export const metadata: Metadata = {
	title: "JStack App",
	description: "Created using JStack",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="h-full">
			<body className="antialiased min-h-screen h-full flex flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
				<Providers>
					<Header />
					<main className="flex-1 flex flex-col">{children}</main>
				</Providers>
			</body>
		</html>
	);
}
