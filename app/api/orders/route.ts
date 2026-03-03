import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { patchOrderSchema, deleteOrderItemSchema } from "@/lib/validators";

const VALID_ITEM_STATUSES = ["PENDING", "COOKING", "SERVED", "CANCELLED"] as const;

// GET → ดึงออเดอร์ทั้งหมดที่สถานะ OPEN พร้อมข้อมูลโต๊ะและรายการอาหาร
export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const orders = await prisma.order.findMany({
            where: { status: "OPEN" },
            include: {
                table: true,
                items: {
                    include: {
                        menuItem: {
                            select: { id: true, name: true, image: true },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
                user: {
                    select: { id: true, username: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(orders);
    } catch (error) {
        console.error("Failed to fetch orders:", error);
        return NextResponse.json(
            { error: "ไม่สามารถดึงข้อมูลออเดอร์ได้" },
            { status: 500 }
        );
    }
}

// PATCH → อัพเดทสถานะออเดอร์ หรือ สถานะ item แต่ละจาน
export async function PATCH(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const parsed = patchOrderSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { orderId, status, itemId, itemStatus } = parsed.data;

        // --- กรณีอัพเดทสถานะ OrderItem (เช่น PENDING → COOKING → SERVED) ---
        if (itemId && itemStatus) {
            if (!VALID_ITEM_STATUSES.includes(itemStatus)) {
                return NextResponse.json({ error: "Invalid item status" }, { status: 400 });
            }

            const updatedItem = await prisma.orderItem.update({
                where: { id: itemId },
                data: { status: itemStatus },
            });
            return NextResponse.json(updatedItem);
        }

        // --- กรณีอัพเดทสถานะ Order (เช่น OPEN → PAID) ---
        if (!orderId) {
            return NextResponse.json(
                { error: "กรุณาระบุ ID ออเดอร์" },
                { status: 400 }
            );
        }

        const existing = await prisma.order.findUnique({
            where: { id: orderId },
            include: { table: true },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "ไม่พบออเดอร์ที่ต้องการ" },
                { status: 404 }
            );
        }

        // อัพเดทสถานะออเดอร์
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: status || "PAID" },
            include: {
                table: true,
                items: {
                    include: {
                        menuItem: {
                            select: { id: true, name: true, image: true },
                        },
                    },
                },
            },
        });

        // ถ้าจ่ายเงินแล้ว → เปลี่ยนสถานะโต๊ะเป็นว่าง + ล้าง session
        if (status === "PAID" || !status) {
            // เช็คว่ายังมี order OPEN อื่นที่โต๊ะเดียวกันไหม
            const otherOpenOrders = await prisma.order.count({
                where: {
                    tableId: existing.tableId,
                    status: "OPEN",
                    id: { not: orderId },
                },
            });

            // ถ้าไม่มี order OPEN เหลือแล้ว → ปล่อยโต๊ะ
            if (otherOpenOrders === 0) {
                await prisma.table.update({
                    where: { id: existing.tableId },
                    data: {
                        status: "AVAILABLE",
                        currentSessionToken: null,
                    },
                });
            }
        }

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error("Failed to update order:", error);
        return NextResponse.json(
            { error: "ไม่สามารถอัพเดทออเดอร์ได้" },
            { status: 500 }
        );
    }
}

// DELETE → ลบรายการอาหาร (OrderItem) ออกจากออเดอร์
export async function DELETE(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const url = new URL(request.url);
        const parsed = deleteOrderItemSchema.safeParse({ itemId: url.searchParams.get("itemId") });

        if (!parsed.success) {
            return NextResponse.json(
                { error: "กรุณาระบุ ID ของรายการที่ต้องการลบ" },
                { status: 400 }
            );
        }

        // ค้นหา OrderItem ก่อนเพื่อเอาราคาและ orderId ไปหักลบ
        const itemToDelete = await prisma.orderItem.findUnique({
            where: { id: parsed.data.itemId }
        });

        if (!itemToDelete) {
            return NextResponse.json(
                { error: "ไม่พบรายการอาหารที่ต้องการลบ" },
                { status: 404 }
            );
        }

        // ลบ OrderItem
        await prisma.orderItem.delete({
            where: { id: parsed.data.itemId }
        });

        // อัพเดทยอดรวม totalPrice ของ Order
        const itemTotalPrice = Number(itemToDelete.price) * itemToDelete.quantity;

        await prisma.order.update({
            where: { id: itemToDelete.orderId },
            data: {
                totalPrice: {
                    decrement: itemTotalPrice
                }
            }
        });

        // กรณีที่ลบแล้วไม่เหลือไอเทมใน Order เลย อาจจะต้องลบ Order นั้นด้วย (เสริม)
        const remainingItems = await prisma.orderItem.count({
            where: { orderId: itemToDelete.orderId }
        });

        if (remainingItems === 0) {
            const order = await prisma.order.delete({
                where: { id: itemToDelete.orderId },
                include: { table: true }
            });
            // ปล่อยโต๊ะให้ว่างถ้านี่คือออเดอร์สุดท้าย
            const parentTable = await prisma.table.count({
                where: {
                    id: order.tableId,
                    orders: { some: { status: "OPEN" } }
                }
            });
            if (parentTable === 0) {
                await prisma.table.update({
                    where: { id: order.tableId },
                    data: { status: "AVAILABLE", currentSessionToken: null }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting order item:", error);
        return NextResponse.json(
            { error: "ไม่สามารถลบรายการอาหารได้" },
            { status: 500 }
        );
    }
}
