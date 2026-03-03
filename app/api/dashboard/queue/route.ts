import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Fetch all active order items (PENDING, COOKING) sorted by oldest first
        const activeQueue = await prisma.orderItem.findMany({
            where: {
                status: {
                    in: ["PENDING", "COOKING"],
                },
                order: {
                    status: "OPEN"
                }
            },
            include: {
                order: {
                    include: { table: true }
                }
            },
            orderBy: {
                createdAt: "asc" // First in, first out
            },
        });

        // Format for frontend
        const formattedQueue = activeQueue.map((item: typeof activeQueue[number]) => ({
            id: item.id,
            menuItemName: item.menuItemName,
            optionsText: item.optionsText,
            quantity: item.quantity,
            status: item.status,
            createdAt: item.createdAt,
            tableNo: item.order.table.tableNo
        }));

        return NextResponse.json(formattedQueue);
    } catch (error) {
        console.error("Error fetching order queue:", error);
        return NextResponse.json(
            { error: "Failed to fetch order queue" },
            { status: 500 }
        );
    }
}
