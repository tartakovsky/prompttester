import { clerkMiddleware } from '@clerk/nextjs/server';

// Clerk proxy makes auth() available in server components and API routes.
// Next.js 16 renamed middleware.ts → proxy.ts.
// Route protection is handled client-side via <SignedIn>/<SignedOut> and useAuth().
export default clerkMiddleware();
