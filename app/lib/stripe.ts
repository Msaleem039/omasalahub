import { createHmac, timingSafeEqual } from "crypto";

export function verifyStripeSignature(payload: string, header: string | null, secret: string, nowSeconds: number, tolerance = 300) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(",").map((piece) => {
      const [key, value] = piece.split("=");
      return [key, value];
    }),
  );
  const timestamp = Number(parts.t);
  const signature = parts.v1;
  if (!Number.isFinite(timestamp) || !signature) return false;
  if (Math.abs(nowSeconds - timestamp) > tolerance) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
