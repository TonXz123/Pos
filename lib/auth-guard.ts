import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Reusable auth guard for API routes.
 * Returns the session if authenticated, or a 401 response.
 */
export async function requireAuth() {
    const session = await auth();
    if (!session?.user) {
        return {
            session: null,
            unauthorized: NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            ),
        };
    }
    return { session, unauthorized: null };
}
