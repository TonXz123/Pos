import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    // กำหนด Headers สำหรับการทำ Server-Sent Events (SSE)
    const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
    };

    let intervalId: NodeJS.Timeout;
    let isActive = true;

    const stream = new ReadableStream({
        async start(controller) {
            // ฟังก์ชันสำหรับส่งข้อมูลโต๊ะปัจจุบันกลับไปหา Client
            const sendTables = async () => {
                if (!isActive) return;
                try {
                    const tables = await prisma.table.findMany({
                        orderBy: { tableNo: "asc" },
                    });

                    // ป้องกัน Error "Invalid state: Controller is already closed"
                    if (isActive) {
                        controller.enqueue(
                            new TextEncoder().encode(`data: ${JSON.stringify(tables)}\n\n`)
                        );
                    }
                } catch (error) {
                    // ปล่อยผ่านไปถ้าเชื่อมต่อหลุดระหว่างดึงข้อมูล
                    console.error("SSE stream close error:", error);
                }
            };

            // 1. ส่งข้อมูลครั้งแรกทันทีที่เชื่อมต่อติด
            await sendTables();

            // 2. ตั้งเวลาสุ่มเช็ค Database ทุกๆ 5 วินาที แล้วส่งข้อมูลสตรีมกลับไป
            intervalId = setInterval(sendTables, 5000);

            // เมื่อ Client ปิดหน้าจอ หรือเปลี่ยนหน้าเบราว์เซอร์
            request.signal.addEventListener("abort", () => {
                isActive = false;
                clearInterval(intervalId);
            });
        },
        cancel() {
            // ฟังก์ชันนี้จะถูกเรียกเมื่อ Stream ถูกยกเลิกด้วยวิธีอื่นๆ จากฝั่งเบราว์เซอร์
            isActive = false;
            clearInterval(intervalId);
        }
    });

    return new NextResponse(stream, { headers });
}
