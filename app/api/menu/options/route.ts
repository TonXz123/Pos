import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { createMenuOptionSchema, deleteMenuOptionSchema } from "@/lib/validators";

// POST → เพิ่ม option ให้เมนู (🔒 ต้อง auth)
export async function POST(request: Request) {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;

    try {
        const body = await request.json();
        const parsed = createMenuOptionSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลให้ครบ", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const menuItem = await prisma.menuItem.findUnique({
            where: { id: parsed.data.menuItemId },
        });

        if (!menuItem) {
            return NextResponse.json(
                { error: "ไม่พบเมนูที่ต้องการเพิ่ม option" },
                { status: 404 }
            );
        }

        const newOption = await prisma.menuOption.create({
            data: {
                menuItemId: parsed.data.menuItemId,
                groupName: parsed.data.groupName,
                name: parsed.data.name,
                additionalPrice: parsed.data.additionalPrice,
            },
        });

        return NextResponse.json(newOption, { status: 201 });
    } catch (error) {
        console.error("Failed to create menu option:", error);
        return NextResponse.json(
            { error: "ไม่สามารถเพิ่ม option ได้" },
            { status: 500 }
        );
    }
}

// DELETE → ลบ option (🔒 ต้อง auth)
export async function DELETE(request: Request) {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;

    try {
        const { searchParams } = new URL(request.url);
        const parsed = deleteMenuOptionSchema.safeParse({ id: searchParams.get("id") });

        if (!parsed.success) {
            return NextResponse.json(
                { error: "กรุณาระบุ ID option" },
                { status: 400 }
            );
        }

        await prisma.menuOption.delete({
            where: { id: parsed.data.id },
        });

        return NextResponse.json({ message: "ลบ option สำเร็จ" });
    } catch (error) {
        console.error("Failed to delete menu option:", error);
        return NextResponse.json(
            { error: "ไม่สามารถลบ option ได้" },
            { status: 500 }
        );
    }
}
