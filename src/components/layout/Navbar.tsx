"use client";

import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  SignOutButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold">
            CHI Neighborhoods
          </Link>
          <Link
            href="/neighborhoods"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Browse
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
        </div>
      </nav>
    </header>
  );
}
