"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Heart, Star } from "lucide-react";

export default function ThankYouPage() {
    const [dots, setDots] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(d => d.length >= 3 ? "" : d + ".");
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
            {/* Decorative blobs */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-orange-200 rounded-full opacity-20 blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-300 rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2" />

            {/* Card */}
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl px-10 py-14 max-w-sm w-full flex flex-col items-center">
                {/* Icon */}
                <div className="relative mb-6">
                    <div className="w-28 h-28 bg-orange-100 rounded-full flex items-center justify-center text-6xl">
                        🍜
                    </div>
                    <div className="absolute -top-1 -right-1 w-9 h-9 bg-green-400 rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle2 size={20} className="text-white" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black text-gray-900 mb-3 leading-tight">
                    ขอบคุณที่<br />อุดหนุนครับ!
                </h1>

                {/* Subtitle */}
                <p className="text-gray-500 text-sm mb-8">
                    ทางร้านหวังว่าอาหารจะถูกใจนะครับ<br />
                    แล้วเจอกันใหม่ 😊
                </p>

                {/* Stars */}
                <div className="flex gap-1 mb-8">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={24} className="text-amber-400 fill-amber-400" />
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3 w-full flex items-center justify-center gap-2 text-orange-600 text-sm font-medium">
                    <Heart size={14} className="fill-orange-500 text-orange-500 animate-pulse" />
                    กรุณาสแกน QR อีกครั้งเพื่อสั่งอาหาร
                </div>
            </div>

            <p className="text-gray-400 text-xs mt-8">ปิดหน้านี้หรือสแกน QR Code ใหม่ที่โต๊ะ{dots}</p>
        </div>
    );
}
