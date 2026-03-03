import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

// GET → ดึงข้อมูลสรุป Dashboard (🔒 ต้อง auth)
export async function GET() {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;

    try {
        // วันนี้ (00:00 - 23:59)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // 1. ยอดขายวันนี้ (เฉพาะออเดอร์ที่จ่ายแล้ว)
        const salesResult = await prisma.order.aggregate({
            where: {
                status: "PAID",
                createdAt: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
            _sum: {
                totalPrice: true,
            },
        });

        // 2. จำนวนออเดอร์วันนี้ (ทุกสถานะ)
        const totalOrders = await prisma.order.count({
            where: {
                createdAt: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
        });

        // 3. จำนวนโต๊ะทั้งหมด และที่ใช้งานอยู่
        const totalTables = await prisma.table.count();
        const occupiedTables = await prisma.table.count({
            where: { status: "OCCUPIED" },
        });


        return NextResponse.json({
            totalSales: Number(salesResult._sum.totalPrice || 0),
            totalOrders,
            tables: {
                occupied: occupiedTables,
                total: totalTables,
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "ไม่สามารถดึงข้อมูล Dashboard ได้" },
            { status: 500 }
        );
    }
}
