import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

// GET → ดึงข้อมูลโต๊ะ + ตรวจ signature
export async function GET(
    request: Request,
    { params }: { params: Promise<{ tableNo: string }> }
) {
    const { tableNo } = await params;
    const { searchParams } = new URL(request.url);
    const session = searchParams.get("session");
    const sign = searchParams.get("sign");
    const tableNoInt = parseInt(tableNo);

    if (isNaN(tableNoInt) || !session || !sign) {
        return NextResponse.json({ error: "พารามิเตอร์ไม่ครบ" }, { status: 400 });
    }

    // ตรวจ HMAC signature
    const secretKey = process.env.AUTH_SECRET;
    if (!secretKey) {
        console.error("AUTH_SECRET is not set in environment variables");
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const expectedSign = createHmac("sha256", secretKey)
        .update(`${tableNo}:${session}`)
        .digest("hex");

    if (sign !== expectedSign) {
        return NextResponse.json(
            { error: "Signature ไม่ถูกต้อง กรุณาสแกน QR Code ใหม่" },
            { status: 403 }
        );
    }

    try {
        const table = await prisma.table.findUnique({
            where: { tableNo: tableNoInt },
        });

        if (!table) {
            return NextResponse.json({ error: "ไม่พบโต๊ะ" }, { status: 404 });
        }

        // ตรวจว่า session ตรงกับโต๊ะนี้
        if (table.currentSessionToken !== session) {
            return NextResponse.json(
                { error: "Session หมดอายุ กรุณาสแกน QR Code ใหม่" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            id: table.id,
            tableNo: table.tableNo,
            status: table.status,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
    }
}
