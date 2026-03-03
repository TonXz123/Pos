import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";
import { createCustomerOrderSchema } from "@/lib/validators";

function verifySignature(tableNo: string, session: string, sign: string): boolean {
    const secretKey = process.env.AUTH_SECRET;
    if (!secretKey) {
        console.error("AUTH_SECRET is not set in environment variables");
        return false;
    }

    const expected = createHmac("sha256", secretKey)
        .update(`${tableNo}:${session}`)
        .digest("hex");
    return expected === sign;
}

// GET → ดึงออเดอร์ปัจจุบัน
export async function GET(
    request: Request,
    { params }: { params: Promise<{ tableNo: string }> }
) {
    const { tableNo } = await params;
    const { searchParams } = new URL(request.url);
    const session = searchParams.get("session") || "";
    const sign = searchParams.get("sign") || "";

    if (!verifySignature(tableNo, session, sign)) {
        return NextResponse.json({ error: "Signature ไม่ถูกต้อง" }, { status: 403 });
    }

    try {
        const tableNoInt = parseInt(tableNo);
        const table = await prisma.table.findUnique({ where: { tableNo: tableNoInt } });
        if (!table || table.currentSessionToken !== session) {
            return NextResponse.json({ error: "Session ไม่ถูกต้อง" }, { status: 403 });
        }

        const order = await prisma.order.findFirst({
            where: {
                tableId: table.id,
                sessionToken: session,
                status: { in: ["OPEN", "PENDING_APPROVAL"] },
            },
            include: {
                items: {
                    include: { menuItem: { select: { id: true, name: true, image: true } } },
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("Failed to fetch table order:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
    }
}

// POST → สร้าง/เพิ่มออเดอร์
export async function POST(
    request: Request,
    { params }: { params: Promise<{ tableNo: string }> }
) {
    const { tableNo } = await params;

    try {
        const body = await request.json();

        // ✅ Validate input with Zod
        const parsed = createCustomerOrderSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { session, sign, items } = parsed.data;

        if (!verifySignature(tableNo, session, sign)) {
            return NextResponse.json({ error: "Signature ไม่ถูกต้อง กรุณาสแกน QR Code ใหม่" }, { status: 403 });
        }

        const tableNoInt = parseInt(tableNo);
        const table = await prisma.table.findUnique({ where: { tableNo: tableNoInt } });

        if (!table) {
            return NextResponse.json({ error: "ไม่พบโต๊ะ" }, { status: 404 });
        }

        if (table.currentSessionToken !== session) {
            return NextResponse.json({ error: "Session หมดอายุ กรุณาสแกน QR Code ใหม่" }, { status: 403 });
        }

        // ✅ CRITICAL FIX: ดึงราคาจริงจาก Database — ห้ามใช้ราคาจาก client
        const menuItemIds = items.map(i => i.menuItemId);
        const dbMenuItems = await prisma.menuItem.findMany({
            where: { id: { in: menuItemIds }, isAvailable: true },
            select: { id: true, basePrice: true, name: true },
        });

        const priceMap = new Map(dbMenuItems.map(m => [m.id, Number(m.basePrice)]));
        const nameMap = new Map(dbMenuItems.map(m => [m.id, m.name]));

        // ตรวจสอบว่าเมนูที่สั่งมีอยู่จริงและพร้อมจำหน่าย
        for (const item of items) {
            if (!priceMap.has(item.menuItemId)) {
                return NextResponse.json(
                    { error: `เมนู "${item.menuItemName}" ไม่พร้อมจำหน่ายหรือไม่มีอยู่ในระบบ` },
                    { status: 400 }
                );
            }
        }

        // คำนวณราคาจริงจาก DB
        const totalPrice = items.reduce((sum, item) => {
            const realPrice = priceMap.get(item.menuItemId)!;
            return sum + realPrice * item.quantity;
        }, 0);

        const orderItems = items.map((item) => ({
            menuItemId: item.menuItemId,
            menuItemName: nameMap.get(item.menuItemId) || item.menuItemName,
            quantity: item.quantity,
            price: priceMap.get(item.menuItemId)! * item.quantity,
            optionsText: item.optionsText || null,
            status: "PENDING" as const,
        }));

        let order = await prisma.order.findFirst({
            where: {
                tableId: table.id,
                sessionToken: session,
                status: { in: ["OPEN", "PENDING_APPROVAL"] },
            },
        });

        if (order) {
            order = await prisma.order.update({
                where: { id: order.id },
                data: {
                    totalPrice: { increment: totalPrice },
                    items: { create: orderItems },
                },
                include: {
                    items: {
                        include: { menuItem: { select: { id: true, name: true, image: true } } },
                        orderBy: { createdAt: "asc" },
                    },
                },
            });
        } else {
            order = await prisma.order.create({
                data: {
                    tableId: table.id,
                    sessionToken: session,
                    status: "OPEN",
                    totalPrice,
                    items: { create: orderItems },
                },
                include: {
                    items: {
                        include: { menuItem: { select: { id: true, name: true, image: true } } },
                        orderBy: { createdAt: "asc" },
                    },
                },
            });
        }

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error("Failed to create/update order:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
    }
}
