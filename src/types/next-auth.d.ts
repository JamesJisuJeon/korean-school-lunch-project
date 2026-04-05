import { Role } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: Role[];
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    roles: Role[];
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: Role[];
    mustChangePassword: boolean;
  }
}
