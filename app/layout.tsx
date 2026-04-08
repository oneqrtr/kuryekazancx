import type { Metadata } from 'next';
import Script from 'next/script';

import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-poppins' });

export const metadata: Metadata = {
    title: 'kuryekazanc.com.tr - Kurye Maaş Hesaplama ve PSEO Platformu',
    description: 'Esnaf kuryeler için kazanç hesaplayıcı, vergi simülatörü ve platform bazlı gelir analizleri.',
    manifest: '/manifest.json', // Not implemented yet but good to have
    icons: {
        icon: '/favicon.png',
        apple: '/pwa.png',
    }
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="tr">
            <head>
                <Script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8339727538452407"
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />

            </head>
            <body className={`${inter.variable} ${poppins.variable} font-sans bg-gray-50 text-gray-900 flex flex-col min-h-screen`}>

                <Header />
                <main className="flex-grow">
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    );
}
