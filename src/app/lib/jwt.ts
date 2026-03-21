import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

const JWT_SECRET =
  process.env.JWT_SECRET ?? "aurora-admin-secret-change-in-production";
const ALG = "HS256";
const EXPIRES_IN = "7d";

export interface JwtPayload {
  sub: string;
  role: "admin";
  iat: number;
  exp: number;
}

export async function signAdminToken(email: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: ALG })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(secret);
}

export async function verifyAdminToken(
  token: string,
): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if ((payload.role as string) !== "admin") return null;
    return {
      sub: payload.sub as string,
      role: "admin",
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}
