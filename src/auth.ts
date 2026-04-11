import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findFirst({
          where: { email: { equals: (credentials.email as string).toLowerCase(), mode: "insensitive" } },
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.roles = (user as any).roles;
        token.mustChangePassword = (user as any).mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
        (session.user as any).roles = token.roles as Role[];
        (session.user as any).mustChangePassword = token.mustChangePassword as boolean;

        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { roles: true, mustChangePassword: true },
          });
          if (dbUser) {
            (session.user as any).roles = dbUser.roles;
            (session.user as any).mustChangePassword = dbUser.mustChangePassword;
          }
        } catch {
          // DB 조회 실패 시 토큰의 기존 값 유지
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
