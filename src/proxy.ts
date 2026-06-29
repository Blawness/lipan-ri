import NextAuth from "next-auth";
import { rbac } from "./rbac";

const { auth } = NextAuth(rbac.authConfig);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default auth as any;

export const config = {
  matcher: ["/admin/:path*"],
};
