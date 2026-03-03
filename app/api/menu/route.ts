import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createMenuItemSchema, patchMenuItemSchema, deleteMenuItemSchema } from "@/lib/validators";

// GET → ดึงเมนูทั้งหมด
export async function GET() {
    try {
        const menuItems = await prisma.menuItem.findMany({
            include: { options: true },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(menuItems);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "ไม่สามารถดึงข้อมูลเมนูได้" },
            { status: 500 }
        );
    }
}

// POST → เพิ่มเมนูใหม่
export async function POST(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const parsed = createMenuItemSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลให้ครบ (ชื่อ, หมวดหมู่, ราคา)", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        // ตรวจสอบชื่อซ้ำ
        const existing = await prisma.menuItem.findFirst({
            where: { name: parsed.data.name },
        });

        if (existing) {
            return NextResponse.json(
                { error: "ชื่อเมนูนี้มีอยู่แล้ว" },
                { status: 409 }
            );
        }

        const newItem = await prisma.menuItem.create({
            data: {
                name: parsed.data.name,
                category: parsed.data.category,
                basePrice: parsed.data.basePrice,
                image: parsed.data.image || null,
                isAvailable: parsed.data.isAvailable ?? true,
                options: parsed.data.options?.length
                    ? {
                        create: parsed.data.options.map(
                            (opt: { groupName: string; name: string; additionalPrice: number }) => ({
                                groupName: opt.groupName,
                                name: opt.name,
                                additionalPrice: opt.additionalPrice,
                            })
                        ),
                    }
                    : undefined,
            },
            include: { options: true },
        });

        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        console.error("Failed to create menu item:", error);
        return NextResponse.json(
            { error: "ไม่สามารถเพิ่มเมนูได้" },
            { status: 500 }
        );
    }
}

// DELETE → ลบเมนู
export async function DELETE(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const parsed = deleteMenuItemSchema.safeParse({ id: searchParams.get("id") });

        if (!parsed.success) {
            return NextResponse.json(
                { error: "กรุณาระบุ ID เมนู" },
                { status: 400 }
            );
        }

        const existing = await prisma.menuItem.findUnique({
            where: { id: parsed.data.id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "ไม่พบเมนูที่ต้องการลบ" },
                { status: 404 }
            );
        }

        // ลบ options ก่อน แล้วค่อยลบเมนู
        await prisma.menuOption.deleteMany({
            where: { menuItemId: parsed.data.id },
        });

        await prisma.menuItem.delete({
            where: { id: parsed.data.id },
        });

        return NextResponse.json({ message: "ลบเมนูสำเร็จ" });
    } catch (error) {
        console.error("Failed to delete menu item:", error);
        return NextResponse.json(
            { error: "ไม่สามารถลบเมนูได้" },
            { status: 500 }
        );
    }
}

// PATCH → อัพเดทสถานะเปิด/ปิดขาย
export async function PATCH(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const parsed = patchMenuItemSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "กรุณาระบุ ID เมนู" },
                { status: 400 }
            );
        }

        const updated = await prisma.menuItem.update({
            where: { id: parsed.data.id },
            data: { isAvailable: parsed.data.isAvailable },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update menu item:", error);
        return NextResponse.json(
            { error: "ไม่สามารถอัพเดทเมนูได้" },
            { status: 500 }
        );
    }
}
