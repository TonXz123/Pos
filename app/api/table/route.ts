import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { createTableSchema, deleteTableSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// GET → ดึงข้อมูลโต๊ะทั้งหมด (public — ใช้โดย customer page)
export async function GET() {
    try {
        const tables = await prisma.table.findMany({
            orderBy: { tableNo: "asc" },
        });
        return NextResponse.json(tables);
    } catch (error) {
        console.error("Failed to fetch tables:", error);
        return NextResponse.json(
            { error: "ไม่สามารถดึงข้อมูลโต๊ะได้" },
            { status: 500 }
        );
    }
}

// POST → เพิ่มโต๊ะใหม่ (🔒 ต้อง auth)
export async function POST(request: Request) {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;

    try {
        const body = await request.json();
        const parsed = createTableSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "กรุณาระบุเลขโต๊ะที่ถูกต้อง", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        // ตรวจสอบว่าโต๊ะซ้ำหรือไม่
        const existing = await prisma.table.findUnique({
            where: { tableNo: parsed.data.tableNo },
        });

        if (existing) {
            return NextResponse.json(
                { error: "เลขโต๊ะนี้มีอยู่แล้ว" },
                { status: 409 }
            );
        }

        const newTable = await prisma.table.create({
            data: {
                tableNo: parsed.data.tableNo,
                status: "AVAILABLE",
            },
        });

        return NextResponse.json(newTable, { status: 201 });
    } catch (error) {
        console.error("Failed to create table:", error);
        return NextResponse.json(
            { error: "ไม่สามารถเพิ่มโต๊ะได้" },
            { status: 500 }
        );
    }
}

// DELETE → ลบโต๊ะ (🔒 ต้อง auth)
export async function DELETE(request: Request) {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;

    try {
        const { searchParams } = new URL(request.url);
        const parsed = deleteTableSchema.safeParse({ id: searchParams.get("id") });

        if (!parsed.success) {
            return NextResponse.json(
                { error: "กรุณาระบุ ID โต๊ะ" },
                { status: 400 }
            );
        }

        const existing = await prisma.table.findUnique({
            where: { id: parsed.data.id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "ไม่พบโต๊ะที่ต้องการลบ" },
                { status: 404 }
            );
        }

        if (existing.status === "OCCUPIED") {
            return NextResponse.json(
                { error: "ไม่สามารถลบโต๊ะที่กำลังใช้งานอยู่ได้" },
                { status: 409 }
            );
        }

        await prisma.table.delete({
            where: { id: parsed.data.id },
        });

        return NextResponse.json({ message: "ลบโต๊ะสำเร็จ" });
    } catch (error) {
        console.error("Failed to delete table:", error);
        return NextResponse.json(
            { error: "ไม่สามารถลบโต๊ะได้" },
            { status: 500 }
        );
    }
}