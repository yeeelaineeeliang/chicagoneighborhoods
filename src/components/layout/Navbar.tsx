"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold">
            CHI Neighborhoods
          </Link>
          {/* Desktop nav links */}
          <div className="hidden gap-4 sm:flex">
            <Link
              href="/neighborhoods"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Browse
            </Link>
            <Link
              href="/community"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Community
            </Link>
            <Show when="signed-in">
              <Link
                href="/favorites"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                My Favorites
              </Link>
            </Show>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/neighborhoods"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              href="/community"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              Community
            </Link>
            <Show when="signed-in">
              <Link
                href="/favorites"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                My Favorites
              </Link>
            </Show>
          </div>
        </div>
      )}
    </header>
  );
}
