import NextAuth from "next-auth";
import { authConfig } from "@blawness/admin-kit/auth/config";

const { auth } = NextAuth(authConfig);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default auth as any;

export const config = {
  matcher: ["/admin/:path*"],
};
