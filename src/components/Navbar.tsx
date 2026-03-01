"use client";

import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{ 
        background: 'rgba(8, 8, 8, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)'
      }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold" style={{ 
            fontFamily: 'var(--font-noto-serif-sc), serif',
            color: '#f2efe9'
          }}>
            拟<em style={{ color: '#e2a84b', fontStyle: 'normal' }}>像</em>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-white"
            style={{ color: 'rgba(242,239,233,0.5)' }}>
            首页
          </Link>
          <Link href="/pricing" className="text-sm font-medium transition-colors hover:text-white"
            style={{ color: 'rgba(242,239,233,0.5)' }}>
            定价
          </Link>
          <SignedIn>
            <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-white"
              style={{ color: 'rgba(242,239,233,0.5)' }}>
              控制台
            </Link>
          </SignedIn>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link 
              href="/sign-in"
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:opacity-80"
              style={{ color: '#f2efe9' }}
            >
              登录
            </Link>
            <Link 
              href="/sign-up"
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:translate-y-[-2px]"
              style={{ 
                background: 'linear-gradient(135deg, #e2a84b, #d4953f)',
                color: '#000',
                boxShadow: '0 0 20px rgba(226,168,75,0.15), 0 0 60px rgba(226,168,75,0.06)'
              }}
            >
              开始创作
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: {
                    width: '36px',
                    height: '36px'
                  }
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
