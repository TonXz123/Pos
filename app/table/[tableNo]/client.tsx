"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ShoppingCart, Plus, Minus, X, ChevronRight, Utensils,
    Search, CheckCircle2, Loader2, ArrowLeft, Clock, ChefHat,
} from "lucide-react";
import { AlertModal } from "@/components/ui/modals";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuOption { id: string; groupName: string; name: string; additionalPrice: number; }
interface MenuItem { id: string; name: string; category: string; image: string | null; basePrice: number; isAvailable: boolean; options: MenuOption[]; }
interface CartItem { menuItemId: string; menuItemName: string; quantity: number; unitPrice: number; price: number; optionsText: string; }
interface OrderItem { id: string; menuItemName: string; quantity: number; price: number; optionsText: string | null; status: "PENDING" | "COOKING" | "SERVED" | "CANCELLED"; }

type PageState = "menu" | "ordered";

const fmt = (p: number | string) =>
    `฿${Number(p).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const STATUS: Record<OrderItem["status"], { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: { label: "รอทำ", color: "text-amber-600 bg-amber-50", icon: <Clock className="w-3 h-3" /> },
    COOKING: { label: "กำลังทำ", color: "text-blue-600 bg-blue-50", icon: <ChefHat className="w-3 h-3" /> },
    SERVED: { label: "เสิร์ฟแล้ว", color: "text-green-600 bg-green-50", icon: <CheckCircle2 className="w-3 h-3" /> },
    CANCELLED: { label: "ยกเลิก", color: "text-red-500 bg-red-50", icon: <X className="w-3 h-3" /> },
};

// ─── Props ────────────────────────────────────────────────────────────────────
export default function TableOrderClient({
    tableNo,
    sessionToken,
    signature,
}: {
    tableNo: number;
    sessionToken: string;
    signature: string;
}) {
    const [pageState, setPageState] = useState<PageState>("menu");
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
    const [search, setSearch] = useState("");

    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, MenuOption>>({});
    const [quantity, setQuantity] = useState(1);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [orderedItems, setOrderedItems] = useState<OrderItem[]>([]);
    const [orderId, setOrderId] = useState<string | null>(null);

    const [errorAlert, setErrorAlert] = useState<string | null>(null);

    // Load menu
    useEffect(() => {
        fetch("/api/menu").then(r => r.json()).then((data: MenuItem[]) => {
            const avail = data.filter(m => m.isAvailable);
            setMenuItems(avail);
            setCategories(Array.from(new Set(avail.map(m => m.category))));
        });
    }, []);

    const router = useRouter();

    // Load existing order — also polls for session expiry
    const loadOrder = useCallback(async () => {
        const res = await fetch(`/api/table/${tableNo}/order?session=${sessionToken}&sign=${signature}`);

        // Session invalid / expired → redirect to thank you
        if (res.status === 401 || res.status === 403) {
            router.replace("/thankyou");
            return;
        }

        const order = await res.json();

        // Order has been paid → redirect to thank you
        if (order?.status === "PAID") {
            router.replace("/thankyou");
            return;
        }

        if (order?.id) {
            setOrderId(order.id);
            setOrderedItems(order.items || []);
            setPageState("ordered");
        }
    }, [tableNo, sessionToken, signature, router]);

    useEffect(() => {
        loadOrder();
        // Poll every 15 seconds to detect if the session has expired / order is paid
        const interval = setInterval(loadOrder, 15000);
        return () => clearInterval(interval);
    }, [loadOrder]);

    // Cart
    const addToCart = () => {
        if (!selectedItem) return;
        const opts = Object.values(selectedOptions);
        const optionsText = opts.map(o => o.name).join(", ");
        const addl = opts.reduce((s, o) => s + Number(o.additionalPrice), 0);
        const unitPrice = Number(selectedItem.basePrice) + addl;
        const key = `${selectedItem.id}|${optionsText}`;

        setCart(prev => {
            const ex = prev.find(c => `${c.menuItemId}|${c.optionsText}` === key);
            if (ex) return prev.map(c => `${c.menuItemId}|${c.optionsText}` === key
                ? { ...c, quantity: c.quantity + quantity, price: (c.quantity + quantity) * unitPrice }
                : c);
            return [...prev, { menuItemId: selectedItem.id, menuItemName: selectedItem.name, quantity, unitPrice, price: unitPrice * quantity, optionsText }];
        });
        setSelectedItem(null); setSelectedOptions({}); setQuantity(1);
    };

    const cartTotal = cart.reduce((s, c) => s + c.price, 0);
    const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

    const updateQty = (idx: number, delta: number) => {
        setCart(prev => {
            const u = [...prev];
            u[idx] = { ...u[idx], quantity: u[idx].quantity + delta, price: (u[idx].quantity + delta) * u[idx].unitPrice };
            if (u[idx].quantity <= 0) u.splice(idx, 1);
            return u;
        });
    };

    const submitOrder = async () => {
        if (!sessionToken || cart.length === 0) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/table/${tableNo}/order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session: sessionToken,
                    sign: signature,
                    items: cart.map(c => ({ menuItemId: c.menuItemId, menuItemName: c.menuItemName, quantity: c.quantity, price: c.unitPrice, optionsText: c.optionsText || null })),
                }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error || "เกิดข้อผิดพลาด"); }
            const order = await res.json();
            setOrderId(order.id); setOrderedItems(order.items || []);
            setCart([]); setCartOpen(false); setPageState("ordered");
        } catch (e) { setErrorAlert((e as Error).message); }
        finally { setIsSubmitting(false); }
    };

    const optionGroups = selectedItem ? Array.from(new Set(selectedItem.options.map(o => o.groupName))) : [];
    const selectedAddl = Object.values(selectedOptions).reduce((s, o) => s + Number(o.additionalPrice), 0);
    const filtered = menuItems.filter(m => {
        const cat = activeCategory === "ทั้งหมด" || m.category === activeCategory;
        const srch = m.name.toLowerCase().includes(search.toLowerCase());
        return cat && srch;
    });

    // ─── ORDER PLACED ──────────────────────────────────────────────────────────
    if (pageState === "ordered") return (
        <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-orange-100 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Utensils className="w-4 h-4 text-orange-500" />
                </div>
                <div><p className="text-xs text-gray-400">โต๊ะที่</p><p className="font-bold text-gray-800 leading-none">{tableNo}</p></div>
            </div>

            <div className="p-4 max-w-md mx-auto space-y-4">
                <div className="bg-linear-to-r from-green-500 to-emerald-500 rounded-2xl p-5 text-white shadow-lg text-center">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
                    <h2 className="text-xl font-bold">ส่งออเดอร์แล้ว!</h2>
                    <p className="text-green-100 text-sm mt-1">ทางร้านได้รับคำสั่งของท่านแล้วครับ</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800">รายการอาหารของท่าน</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {orderedItems.map(item => {
                            const s = STATUS[item.status];
                            return (
                                <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 truncate">{item.menuItemName}</p>
                                        {item.optionsText && <p className="text-xs text-gray-400 truncate">{item.optionsText}</p>}
                                        <p className="text-xs text-gray-500 mt-0.5">x{item.quantity}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className="font-semibold text-orange-600">{fmt(item.price)}</span>
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.icon}{s.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="px-4 py-3 bg-orange-50/50 flex justify-between items-center">
                        <span className="text-sm text-gray-500">ยอดรวมทั้งหมด</span>
                        <span className="font-bold text-orange-600 text-lg">{fmt(orderedItems.reduce((s, i) => s + Number(i.price), 0))}</span>
                    </div>
                </div>

                <button onClick={() => setPageState("menu")}
                    className="w-full py-3.5 px-6 bg-linear-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> สั่งอาหารเพิ่ม
                </button>
            </div>
        </div>
    );

    // ─── MENU PAGE ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
                <div className="px-4 pt-3 pb-2 flex items-center gap-3">
                    {orderId && (
                        <button onClick={() => setPageState("ordered")}
                            className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors">
                            <ArrowLeft className="w-4 h-4 text-gray-600" />
                        </button>
                    )}
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Utensils className="w-4 h-4 text-orange-500" />
                        </div>
                        <div><p className="text-xs text-gray-400">โต๊ะที่</p><p className="font-bold text-gray-800 leading-none">{tableNo}</p></div>
                    </div>
                    <button onClick={() => setCartOpen(true)}
                        className="relative flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl shadow-md hover:bg-orange-600 transition-colors">
                        <ShoppingCart className="w-4 h-4" />
                        <span className="font-bold text-sm">{fmt(cartTotal)}</span>
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{cartCount}</span>
                        )}
                    </button>
                </div>

                <div className="px-4 pb-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="ค้นหาเมนู..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 placeholder-gray-400" />
                    </div>
                </div>

                <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
                    {["ทั้งหมด", ...categories].map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? "bg-orange-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            <div className="p-4 grid grid-cols-2 gap-3 pb-32">
                {filtered.length === 0 && (
                    <div className="col-span-2 text-center py-16 text-gray-400">
                        <Utensils className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>ไม่พบเมนูที่ค้นหา</p>
                    </div>
                )}
                {filtered.map(item => (
                    <button key={item.id} onClick={() => { setSelectedItem(item); setSelectedOptions({}); setQuantity(1); }}
                        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all text-left group">
                        <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                            {item.image
                                ? <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                                : <div className="w-full h-full flex items-center justify-center"><Utensils className="w-10 h-10 text-gray-300" /></div>}
                        </div>
                        <div className="p-3">
                            <p className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{item.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                            <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-orange-500 text-sm">{fmt(item.basePrice)}</span>
                                <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Plus className="w-3.5 h-3.5 text-orange-500" />
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* ─── Item Modal ────────────────────────────────────────────────────── */}
            {selectedItem && (
                <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
                    onClick={e => { if (e.target === e.currentTarget) setSelectedItem(null); }}>
                    <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl animate-slide-up">
                        <div className="relative w-full aspect-video bg-gray-100 shrink-0">
                            {selectedItem.image
                                ? <Image src={selectedItem.image} alt={selectedItem.name} fill className="object-cover" unoptimized />
                                : <div className="w-full h-full flex items-center justify-center"><Utensils className="w-16 h-16 text-gray-300" /></div>}
                            <button onClick={() => setSelectedItem(null)}
                                className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur rounded-full flex items-center justify-center">
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-5 space-y-5">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedItem.name}</h2>
                                <p className="text-gray-400 text-sm">{selectedItem.category}</p>
                                <p className="text-2xl font-extrabold text-orange-500 mt-1">{fmt(Number(selectedItem.basePrice) + selectedAddl)}</p>
                            </div>

                            {optionGroups.map(group => (
                                <div key={group}>
                                    <p className="font-semibold text-gray-700 mb-2">{group}</p>
                                    <div className="space-y-2">
                                        {selectedItem.options.filter(o => o.groupName === group).map(opt => (
                                            <label key={opt.id}
                                                className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedOptions[group]?.id === opt.id ? "border-orange-400 bg-orange-50" : "border-gray-100 bg-gray-50"}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedOptions[group]?.id === opt.id ? "border-orange-500" : "border-gray-300"}`}>
                                                        {selectedOptions[group]?.id === opt.id && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700">{opt.name}</span>
                                                </div>
                                                {Number(opt.additionalPrice) > 0 && <span className="text-sm text-orange-500 font-semibold">+{fmt(opt.additionalPrice)}</span>}
                                                <input type="radio" className="sr-only" checked={selectedOptions[group]?.id === opt.id}
                                                    onChange={() => setSelectedOptions(prev => ({ ...prev, [group]: opt }))} />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div>
                                <p className="font-semibold text-gray-700 mb-2">จำนวน</p>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                        <Minus className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <span className="text-2xl font-bold text-gray-800 w-8 text-center">{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)}
                                        className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center hover:bg-orange-200 transition-colors">
                                        <Plus className="w-4 h-4 text-orange-600" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 shrink-0">
                            <button onClick={addToCart}
                                className="w-full py-4 bg-linear-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                                <ShoppingCart className="w-5 h-5" />
                                เพิ่มลงตะกร้า — {fmt((Number(selectedItem.basePrice) + selectedAddl) * quantity)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Cart Drawer ────────────────────────────────────────────────────── */}
            {cartOpen && (
                <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
                    onClick={e => { if (e.target === e.currentTarget) setCartOpen(false); }}>
                    <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up">
                        <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">ตะกร้าของคุณ</h2>
                            <button onClick={() => setCartOpen(false)}
                                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-5 space-y-3 py-2">
                            {cart.length === 0
                                ? <div className="text-center py-12 text-gray-400"><ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-200" /><p>ตะกร้าว่างเปล่า</p></div>
                                : cart.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 text-sm">{item.menuItemName}</p>
                                            {item.optionsText && <p className="text-xs text-gray-400 truncate">{item.optionsText}</p>}
                                            <p className="text-sm font-bold text-orange-500 mt-1">{fmt(item.price)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button onClick={() => updateQty(idx, -1)} className="w-7 h-7 bg-white rounded-lg border border-gray-200 flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-colors"><Minus className="w-3 h-3 text-gray-600" /></button>
                                            <span className="w-6 text-center font-bold text-gray-700 text-sm">{item.quantity}</span>
                                            <button onClick={() => updateQty(idx, 1)} className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center hover:bg-orange-200 transition-colors"><Plus className="w-3 h-3 text-orange-600" /></button>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-5 border-t border-gray-100 space-y-3 shrink-0">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">รวมทั้งหมด</span>
                                    <span className="text-2xl font-extrabold text-orange-500">{fmt(cartTotal)}</span>
                                </div>
                                <button onClick={submitOrder} disabled={isSubmitting}
                                    className="w-full py-4 bg-linear-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                    {isSubmitting
                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                        : <>ยืนยันการสั่งอาหาร <ChevronRight className="w-5 h-5" /></>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AlertModal
                isOpen={!!errorAlert}
                onClose={() => setErrorAlert(null)}
                title="แจ้งเตือน"
                description={errorAlert || "เกิดข้อผิดพลาด"}
            />
        </div>
    );
}
