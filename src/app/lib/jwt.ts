import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { InternalError } from "@/shared/errors/internal-error";

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new InternalError("JWT_SECRET is required in production");
  }

  return "aurora-admin-secret-change-in-production";
}

const JWT_SECRET = resolveJwtSecret();
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
