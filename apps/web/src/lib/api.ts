import { type z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

type RouteContext = { params: Promise<Record<string, string | string[]>> };

type AuthHandler<T> = (
  data: T,
  req: Request,
  userId: string,
  ctx: RouteContext
) => Promise<NextResponse>;
type AuthRouteHandler = (
  req: Request,
  userId: string,
  ctx: RouteContext
) => Promise<NextResponse>;
type PublicHandler<T> = (
  data: T,
  req: Request,
  ctx: RouteContext
) => Promise<NextResponse>;
type PublicRouteHandler = (
  req: Request,
  ctx: RouteContext
) => Promise<NextResponse>;

async function requireAuth(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export function withBody<T>(schema: z.ZodType<T>, handler: AuthHandler<T>) {
  return async (req: Request, ctx: RouteContext) => {
    const userId = await requireAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      return await handler(parsed.data, req, userId, ctx);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal error" },
        { status: 500 }
      );
    }
  };
}

export function withRoute(handler: AuthRouteHandler) {
  return async (req: Request, ctx: RouteContext) => {
    const userId = await requireAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      return await handler(req, userId, ctx);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal error" },
        { status: 500 }
      );
    }
  };
}

export function withPublicBody<T>(
  schema: z.ZodType<T>,
  handler: PublicHandler<T>
) {
  return async (req: Request, ctx: RouteContext) => {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      return await handler(parsed.data, req, ctx);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal error" },
        { status: 500 }
      );
    }
  };
}

export function withPublicRoute(handler: PublicRouteHandler) {
  return async (req: Request, ctx: RouteContext) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal error" },
        { status: 500 }
      );
    }
  };
}
