import { clearSession, json, viewer } from "../../../lib/http";
import { getDb } from "../../../lib/db";
import { logout } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const { token } = await viewer();
  logout(getDb(), token);
  await clearSession();
  return json({ ok: true });
}
