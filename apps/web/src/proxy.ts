import { clerkMiddleware } from '@clerk/nextjs/server';

// Clerk middleware makes auth() available in server components and API routes.
// Route protection is handled client-side via <SignedIn>/<SignedOut> and useAuth().
export default clerkMiddleware();
