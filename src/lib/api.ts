import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(error: unknown, fallback = "Invalid request") {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : fallback;
  return NextResponse.json({ error: message }, { status: 400 });
}
