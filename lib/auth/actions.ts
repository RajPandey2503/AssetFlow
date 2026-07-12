"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { UserRole } from "@/app/generated/prisma/enums";
import { createSession, destroySession, requireRole } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export type AuthActionState = {
  error?: string;
  message?: string;
};

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function loginAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = asString(formData, "email").toLowerCase();
  const password = asString(formData, "password");

  if (!isValidEmail(email) || password.length < 8) {
    return { error: "Enter a valid email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.status !== "ACTIVE") {
    return { error: "Invalid credentials." };
  }

  const passwordMatches = await verifyPassword(password, user.password);

  if (!passwordMatches) {
    return { error: "Invalid credentials." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession({ id: user.id, role: user.role });
  redirect("/dashboard");
}

export async function signupAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = asString(formData, "name");
  const email = asString(formData, "email").toLowerCase();
  const password = asString(formData, "password");
  const confirmPassword = asString(formData, "confirmPassword");

  if (name.length < 2) {
    return { error: "Enter your full name." };
  }

  if (!isValidEmail(email)) {
    return { error: "Enter a valid work email." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      role: UserRole.EMPLOYEE,
    },
  });

  await createSession({ id: user.id, role: user.role });
  redirect("/dashboard");
}

export async function forgotPasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = asString(formData, "email").toLowerCase();

  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const resetToken = randomBytes(32).toString("base64url");
    const resetPasswordTokenHash = createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash,
        resetPasswordExpiresAt: new Date(Date.now() + 1000 * 60 * 30),
      },
    });
  }

  return {
    message:
      "If an active AssetFlow account exists for that email, password reset instructions will be sent.",
  };
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function updateUserRoleAction(formData: FormData) {
  const actor = await requireRole([UserRole.ADMIN]);
  const userId = asString(formData, "userId");
  const role = asString(formData, "role") as UserRole;

  if (!Object.values(UserRole).includes(role)) {
    throw new Error("Invalid role.");
  }

  if (actor.id === userId && role !== UserRole.ADMIN) {
    throw new Error("Admins cannot remove their own admin role.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}
