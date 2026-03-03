import { createHmac } from "crypto";
import TableOrderClient from "./client";

// ─── Invalid/Error Page Component ────────────────────────────────────────────
function ErrorPage({ message }: { message: string }) {
    return (
        <div className="min-h-screen bg-linear-to-br from-orange-50 to-amber-50 flex flex-col items-center justify-center p-6 text-center">
            <div
                className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6"
                style={{ fontSize: "2.5rem" }}
            >
                🔒
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                ไม่สามารถเข้าถึงได้
            </h1>
            <p className="text-gray-500 text-sm max-w-xs">{message}</p>
            <p className="text-gray-400 text-xs mt-4">
                กรุณาสแกน QR Code ที่โต๊ะของท่านอีกครั้ง
            </p>
        </div>
    );
}

// ─── Server Component — verifies HMAC before rendering ────────────────────────
export default async function TablePage({
    params,
    searchParams,
}: {
    params: Promise<{ tableNo: string }>;
    searchParams: Promise<{ session?: string; sign?: string }>;
}) {
    const { tableNo } = await params;
    const { session, sign } = await searchParams;

    // 1. ตรวจว่ามี params ครบหรือไม่
    if (!session || !sign) {
        return <ErrorPage message="ลิงก์ไม่ถูกต้อง ไม่พบ session หรือ signature" />;
    }

    // 2. ตรวจ HMAC-SHA256 Signature ฝั่ง Server (ก่อน render)
    const secretKey = process.env.AUTH_SECRET;
    if (!secretKey) throw new Error("AUTH_SECRET is not set in environment variables");

    const expectedSign = createHmac("sha256", secretKey)
        .update(`${tableNo}:${session}`)
        .digest("hex");

    if (sign !== expectedSign) {
        return (
            <ErrorPage message="Signature ไม่ถูกต้องหรือลิงก์หมดอายุ" />
        );
    }

    const tableNoInt = parseInt(tableNo);
    if (isNaN(tableNoInt)) {
        return <ErrorPage message="เลขโต๊ะไม่ถูกต้อง" />;
    }

    // 3. ถ้าผ่านทุกอย่าง → render หน้าเมนู
    return (
        <TableOrderClient
            tableNo={tableNoInt}
            sessionToken={session}
            signature={sign}
        />
    );
}
