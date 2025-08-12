import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const user = await prisma.users.findUnique({
          where: { email: creds.email },
          select: { id: true, email: true, role: true, password_hash: true },
        });
        if (!user || !user.password_hash) return null;
        const ok = await bcrypt.compare(creds.password, user.password_hash);
        if (!ok) return null;
        return { id: user.id, email: user.email, role: user.role } as {
          id: string;
          email: string;
          role: string;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as
          | string
          | undefined;
      }
      return session;
    },
  },
};
