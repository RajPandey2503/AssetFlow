import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/auth/permissions";
import { sessionCookieName } from "@/lib/auth/constants";

const sessionTtlMs = 1000 * 60 * 60 * 8;

type SessionPayload = {
  userId: string;
  role: UserRole;
  expiresAt: number;
};

function getSessionSecret() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "assetflow-dev-session-secret";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function verifySignature(payload: string, signature: string) {
  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

export async function createSession(user: { id: string; role: UserRole }) {
  const payload = encodeBase64Url(
    JSON.stringify({
      userId: user.id,
      role: user.role,
      expiresAt: Date.now() + sessionTtlMs,
    } satisfies SessionPayload),
  );

  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + sessionTtlMs),
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(sessionCookieName)?.value;

  if (!rawSession) {
    return null;
  }

  const [payload, signature] = rawSession.split(".");

  if (!payload || !signature || !verifySignature(payload, signature)) {
    return null;
  }

  const parsed = JSON.parse(decodeBase64Url(payload)) as SessionPayload;

  if (parsed.expiresAt < Date.now()) {
    return null;
  }

  return parsed;
}

export async function getCurrentUser() {
  const session = await readSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return user;
}

export async function requireAuth() {
  if (process.env.MOCK_USER_ROLE) {
    const role = process.env.MOCK_USER_ROLE as UserRole;
    let mockUser = await prisma.user.findFirst({
      where: { role },
    });
    if (!mockUser) {
      mockUser = await prisma.user.create({
        data: {
          name: "Mock Admin User",
          email: "mockadmin@example.com",
          role,
          password: "mockpassword123",
          status: "ACTIVE",
        },
      });
    }
    return mockUser;
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();

  if (!hasRole(user.role, allowedRoles)) {
    redirect("/dashboard");
  }

  return user;
}
