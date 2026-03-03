import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // ดึงเฉพาะออเดอร์ที่จ่ายเงินแล้วจาก 7 วันที่ผ่านมา
        const orders = await prisma.order.findMany({
            where: {
                status: "PAID",
                createdAt: {
                    gte: sevenDaysAgo,
                }
            },
            select: {
                totalPrice: true,
                createdAt: true
            }
        });

        // สร้างข้อมูล 7 วัน (อดีต -> ปัจจุบัน)
        const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
        const dataMap = new Map();

        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i));

            // ใช้ string ปี-เดือน-วัน เพื่อเทียบง่ายๆ (คำนึงถึง Timezone ไทย)
            // เพิ่ม offset 7 ชม. ให้ตรงกับเวลาไทยคร่าวๆ
            d.setHours(d.getHours() + 7);
            const dateString = d.toISOString().split('T')[0];
            const dayName = days[new Date(d.getTime() - (7 * 3600000)).getDay()];

            dataMap.set(dateString, { name: dayName, sales: 0 });
        }

        // รวมยอดขายเข้าในแต่ละวัน
        orders.forEach(order => {
            const d = new Date(order.createdAt);
            d.setHours(d.getHours() + 7); // แปลงเป็นเวลาไทย
            const dString = d.toISOString().split('T')[0];

            if (dataMap.has(dString)) {
                const existing = dataMap.get(dString);
                existing.sales += Number(order.totalPrice);
                dataMap.set(dString, existing);
            }
        });

        const result = Array.from(dataMap.values());

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching sales data:", error);
        return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 });
    }
}
