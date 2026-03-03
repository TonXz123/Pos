import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const username = credentials?.username as string;
          const password = credentials?.password as string;

          if (!username || !password) {

            return null;
          }

          // Dynamic import เพื่อหลีกเลี่ยงปัญหา bundling ของ Next.js
          const { prisma } = await import("@/lib/prisma");

          const user = await prisma.user.findUnique({
            where: { username },
          });

          if (!user || !user.password) {

            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (!passwordsMatch) {

            return null;
          }

          return {
            id: user.id,
            name: user.username,
          };
        } catch (error) {
          console.error("Auth error");
          return null;
        }
      },
    }),
  ],
});
