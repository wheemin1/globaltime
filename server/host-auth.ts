import { createHmac, timingSafeEqual } from "crypto";

interface HostTokenPayload {
  roomId: number;
  hostId: string;
  exp: number;
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function toBase64Url(input: Buffer | string): string {
  const value = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return value
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64");
}

function getSecret(): string {
  return process.env.HOST_TOKEN_SECRET ?? process.env.DATABASE_URL ?? "dev-host-secret";
}

function signPayload(encodedPayload: string): string {
  return toBase64Url(createHmac("sha256", getSecret()).update(encodedPayload).digest());
}

export function createHostToken(roomId: number, hostId: string): string {
  const payload: HostTokenPayload = {
    roomId,
    hostId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyHostToken(token: string, roomId: number, hostId: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [encodedPayload, encodedSignature] = parts;
  const expectedSignature = signPayload(encodedPayload);

  const actualSigBuffer = fromBase64Url(encodedSignature);
  const expectedSigBuffer = fromBase64Url(expectedSignature);
  if (actualSigBuffer.length !== expectedSigBuffer.length) {
    return false;
  }
  if (!timingSafeEqual(actualSigBuffer, expectedSigBuffer)) {
    return false;
  }

  try {
    const payload: HostTokenPayload = JSON.parse(fromBase64Url(encodedPayload).toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now && payload.roomId === roomId && payload.hostId === hostId;
  } catch {
    return false;
  }
}
