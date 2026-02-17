'use client';

import * as React from 'react';
import { SignIn } from '@clerk/nextjs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

/**
 * Renders Clerk's <SignIn withSignUp /> inside a Dialog so new emails
 * create an account instead of showing "account not found."
 */
export function SignInOrUpDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-auto border-none bg-transparent p-0 shadow-none [&>button]:hidden">
          <VisuallyHidden><DialogTitle>Sign in</DialogTitle></VisuallyHidden>
          <SignIn withSignUp routing="virtual" />
        </DialogContent>
      </Dialog>
    </>
  );
}
