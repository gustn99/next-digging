import type {Metadata, Viewport} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Digging',
	description: '쇼핑몰 상품과 링크를 쉽게 아카이빙하세요.',
	manifest: '/manifest.json',
	icons: {
		apple: '/icon-192x192.png',
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'Digging',
	},
	applicationName: 'Digging',
};

export const viewport: Viewport = {
	themeColor: '#18181b',
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
		<body className="min-h-full flex flex-col">{children}</body>
		</html>
	);
}
