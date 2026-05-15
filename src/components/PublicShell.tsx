'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import React, { useState } from 'react';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname.startsWith('/admin')) return null;

  const navLinks = [
    { href: '/blog', label: 'Blog' },
    { href: 'https://www.tabindia.org/ug/closing-cutoff', label: 'Cutoffs', external: true },
    { href: '/blog/category/Guides', label: 'Guides' },
    { href: 'https://www.tabindia.org/ug/college-predictor', label: 'College Predictor', external: true },
  ];

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" onClick={() => setMobileOpen(false)}>
                <span className="text-xl sm:text-2xl font-black tracking-tighter">
                  <span className="text-blue-900">NEET</span>
                  <span className="text-blue-600">Counselling</span>
                  <span className="text-gray-400 text-xs sm:text-sm font-medium">.info</span>
                </span>
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === link.href || pathname.startsWith(link.href + '/')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}
              <Link
                href="/free-neet-counselling"
                className="ml-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Free Counselling
              </Link>
            </nav>

            {/* Mobile right side */}
            <div className="md:hidden flex items-center gap-2">
              <Link
                href="/free-neet-counselling"
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg"
              >
                Free Counselling
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium transition-colors text-gray-700 hover:bg-gray-50"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      pathname === link.href || pathname.startsWith(link.href + '/')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}
              <Link
                href="/free-neet-counselling"
                onClick={() => setMobileOpen(false)}
                className="mt-2 px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl text-center hover:bg-blue-700 transition-colors"
              >
                🎓 Get Free Counselling
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

export function PublicFooter() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <span className="text-xl font-black tracking-tighter">
              <span className="text-white">NEET</span>
              <span className="text-blue-400">Counselling</span>
            </span>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              India&apos;s most comprehensive NEET UG counselling guide. Helping lakhs of students secure their dream medical seats.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase mb-3 sm:mb-4 text-slate-300">Resources</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
              <li><Link href="/blog/category/Cutoffs" className="hover:text-white transition">Cutoff Analysis</Link></li>
              <li><Link href="/blog/category/Guides" className="hover:text-white transition">Admission Guides</Link></li>
              <li><Link href="/college" className="hover:text-white transition">College Directory</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase mb-3 sm:mb-4 text-slate-300">Categories</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/blog/category/AIQ" className="hover:text-white transition">All India Quota</Link></li>
              <li><Link href="/blog/category/State%20Counselling" className="hover:text-white transition">State Counselling</Link></li>
              <li><Link href="/blog/category/Private%20Colleges" className="hover:text-white transition">Private Colleges</Link></li>
              <li><Link href="/blog/category/News" className="hover:text-white transition">Latest News</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase mb-3 sm:mb-4 text-slate-300">Quick Links</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/free-neet-counselling" className="hover:text-white transition">Free Counselling</Link></li>
              <li><Link href="/book-consultation" className="hover:text-white transition">Book Consultation</Link></li>
              <li><Link href="/" className="hover:text-white transition">Rank Predictor</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} NEET Counselling Info. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/" className="hover:text-white transition">Terms</Link>
            <Link href="/" className="hover:text-white transition">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function FloatingElements() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;
  return null;
}
