import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID, createHmac } from "crypto";

// GET → ลูกค้าสแกน QR Code ด้วย ID (cuid แบบสุ่ม ป้องกันการเดา)
// สร้าง session token + HMAC signature แล้ว redirect ไปหน้าเมนู
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return new NextResponse("รหัสโต๊ะไม่ถูกต้อง", { status: 400 });
    }

    try {
        const table = await prisma.table.findUnique({
            where: { id },
        });

        if (!table) {
            return new NextResponse(
                `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
                <h2>ไม่พบโต๊ะที่ระบุ</h2>
                <p style="color:#888">รหัสโต๊ะไม่ถูกต้อง หรือถูกลบไปแล้ว</p>
                </body></html>`,
                { status: 404, headers: { "Content-Type": "text/html" } }
            );
        }

        let sessionToken = table.currentSessionToken;

        // ถ้าโต๊ะว่าง → สร้าง session ใหม่ + เปิดโต๊ะ
        if (table.status === "AVAILABLE" || !sessionToken) {
            sessionToken = randomUUID();
            await prisma.table.update({
                where: { id: table.id },
                data: {
                    status: "OCCUPIED",
                    currentSessionToken: sessionToken,
                },
            });
        }
        // ถ้าโต๊ะ PENDING หรือ OCCUPIED → ใช้ session เดิม (ลูกค้าสแกน QR ซ้ำ)

        // สร้าง HMAC-SHA256 Signature เพื่อ verify ฝั่ง server อีกรอบ
        // สร้างขึ้นจาก tableNo + sessionToken ของโต๊ะนั้นๆ
        const secretKey = process.env.AUTH_SECRET;
        if (!secretKey) {
            console.error("AUTH_SECRET is not set in environment variables");
            return new NextResponse("Server configuration error", { status: 500 });
        }
        const signature = createHmac("sha256", secretKey)
            .update(`${table.tableNo}:${sessionToken}`)
            .digest("hex");

        // Redirect ไปหน้าเมนูพร้อม signed params
        const origin = new URL(request.url).origin;
        const redirectUrl = new URL(`/table/${table.tableNo}`, origin);
        redirectUrl.searchParams.set("session", sessionToken);
        redirectUrl.searchParams.set("sign", signature);

        return NextResponse.redirect(redirectUrl.toString());
    } catch (error) {
        console.error(error);
        return new NextResponse("เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", { status: 500 });
    }
}
