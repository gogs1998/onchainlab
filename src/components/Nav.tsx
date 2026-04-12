"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800 bg-[var(--bg-secondary)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-mono text-xl font-bold tracking-tight">
          OnChain<span className="text-blue-500">Lab</span>
        </Link>
        <div className="flex gap-1 rounded-lg bg-zinc-800/50 p-1">
          <Link
            href="/overview"
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              pathname === "/overview"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/lab"
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              pathname === "/lab"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Lab
          </Link>
        </div>
        <Link
          href="/about"
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          About
        </Link>
      </div>
    </nav>
  );
}
