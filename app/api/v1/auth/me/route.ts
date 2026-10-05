import { ok } from "@/lib/api";
import { currentUser } from "@/lib/auth";

export async function GET() {
  return ok({ user: await currentUser() });
}
