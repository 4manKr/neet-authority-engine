'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import React from 'react';

export function PublicHeader() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <span className="text-2xl font-black tracking-tighter">
                <span className="text-blue-900">NEET</span>
                <span className="text-blue-600">Counselling</span>
                <span className="text-gray-400 text-sm font-medium">.info</span>
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/blog" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              Blog
            </Link>
            <Link href="/blog/category/Cutoffs" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              Cutoffs
            </Link>
            <Link href="/blog/category/Guides" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              Guides
            </Link>
            <Link href="/college" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              Colleges
            </Link>
            <Link href="/free-neet-counselling" className="ml-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              Free Counselling
            </Link>
          </nav>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Link href="/free-neet-counselling" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">
              Free Counselling
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <span className="text-xl font-black tracking-tighter">
              <span className="text-white">NEET</span>
              <span className="text-blue-400">Counselling</span>
            </span>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              India&apos;s most comprehensive NEET UG counselling guide. Helping lakhs of students secure their dream medical seats.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
              <li><Link href="/blog/category/Cutoffs" className="hover:text-white transition">Cutoff Analysis</Link></li>
              <li><Link href="/blog/category/Guides" className="hover:text-white transition">Admission Guides</Link></li>
              <li><Link href="/college" className="hover:text-white transition">College Directory</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Categories</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/blog/category/AIQ" className="hover:text-white transition">All India Quota</Link></li>
              <li><Link href="/blog/category/State%20Counselling" className="hover:text-white transition">State Counselling</Link></li>
              <li><Link href="/blog/category/Private%20Colleges" className="hover:text-white transition">Private Colleges</Link></li>
              <li><Link href="/blog/category/News" className="hover:text-white transition">Latest News</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Quick Links</h3>
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

  return null; // We'll import the actual components here
}
