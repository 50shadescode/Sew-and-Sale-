import './globals.css';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Sew & Sell UNIFORMS | Management Portal',
  description: 'Workshop and Order Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col antialiased">
        <header className="bg-slate-900 border-b border-slate-800 px-8 py-4 sticky top-0 z-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 overflow-hidden rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <Image
                src="/logo.jpg"
                alt="Sew & Sell Logo"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <span className="text-base font-bold text-blue-400 uppercase tracking-widest block">
                SEW & SELL UNIFORMS
              </span>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                Management Portal
              </h1>
            </div>
          </div>

          <nav className="flex bg-slate-950 p-2 rounded-xl border border-slate-800 text-base">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/orders"
              className="px-4 py-2 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              Orders
            </Link>
            <Link
              href="/workshop"
              className="px-4 py-2 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              Workshop
            </Link>
            <Link
              href="/inventory"
              className="px-4 py-2 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              Inventory
            </Link>
            <Link
              href="/finance"
              className="px-4 py-2 rounded-lg font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              Finance
            </Link>
          </nav>
        </header>

        <main className="flex-1 p-8 max-w-[1600px] w-full mx-auto space-y-8">
          {children}
        </main>
      </body>
    </html>
  );
}
