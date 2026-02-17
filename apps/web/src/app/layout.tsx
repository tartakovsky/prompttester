import type { Metadata } from "next";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { SignInOrUpDialog } from "@/components/sign-in-or-up-dialog";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prompt Tester",
  description: "Test and compare LLM prompts across models",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen antialiased">
          <header className="flex items-center justify-between border-b border-border px-4 py-2 md:px-6">
            <span className="text-sm font-semibold tracking-tight">Prompt Tester</span>
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInOrUpDialog>
                <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  Sign in
                </button>
              </SignInOrUpDialog>
            </SignedOut>
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
