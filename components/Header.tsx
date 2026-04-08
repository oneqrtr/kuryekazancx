import Link from 'next/link';

export function Header() {
    return (
        <>
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center gap-2 group">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                                    </svg>
                                </div>
                                <span className="text-xl font-bold tracking-tight text-gray-900">
                                    kurye<span className="text-blue-600">kazanc</span><span className="text-gray-400 text-sm">.com.tr</span>
                                </span>
                            </Link>
                        </div>
                        <nav className="hidden md:flex space-x-8">
                            <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Ana Sayfa</Link>
                            <Link href="/kurye-kazanc-hesaplama" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Kazanç Hesapla</Link>
                        </nav>
                    </div>
                </div>
            </header>

            <div className="bg-blue-600 text-white text-center py-1.5 shadow-inner">
                <p className="text-xs font-bold tracking-wide uppercase">Kurye Kazanç Hesaplama Aracı</p>
            </div>
        </>
    );
}
