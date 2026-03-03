"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Banknote,
    Receipt,
    CircleDollarSign,
    ArrowDownUp,
    CheckCircle2,
    X,
    Loader2,
    Wallet,
    RotateCcw,
    HandCoins,
    ShoppingBag,
    Clock,
    Hash,
    CreditCard,
} from "lucide-react";
import { ConfirmModal, AlertModal } from "../../ui/modals";

// ============ Types ============
interface OrderItem {
    id: string;
    menuItemId?: string | null;
    menuItemName: string;
    optionsText?: string | null;
    quantity: number;
    price: string | number;
    status: "PENDING" | "COOKING" | "SERVED" | "CANCELLED";
    menuItem?: { id: string; name: string; image?: string | null } | null;
}

interface TableInfo {
    id: string;
    tableNo: number;
    status: string;
}

interface OrderData {
    id: string;
    tableId: string;
    status: string;
    totalPrice: string | number;
    createdAt: string;
    table: TableInfo;
    items: OrderItem[];
    user?: { id: string; username: string; role: string } | null;
}

// ============ Sub-components ============

/** Card สรุปยอดเงิน */
const SummaryCard = ({
    label,
    value,
    icon: Icon,
    color,
    bg,
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    color: string;
    bg: string;
}) => (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <h3 className="text-2xl font-black">{value}</h3>
            </div>
            <div className={`${bg} ${color} p-3 rounded-2xl`}>
                <Icon size={22} />
            </div>
        </div>
    </div>
);

/** Modal ตั้งเงินเริ่มต้น */
const StartingCashModal = ({
    isOpen,
    onClose,
    onConfirm,
    currentCash,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
    currentCash: number;
}) => {
    const [amount, setAmount] = useState("");

    if (!isOpen) return null;

    const presets = [500, 1000, 1500, 2000, 3000, 5000];

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">ตั้งเงินเริ่มต้น</h2>
                            <p className="text-sm text-gray-400">ใส่จำนวนเงินสดในลิ้นชัก</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {currentCash > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5">
                        <p className="text-sm text-amber-700">
                            เงินเริ่มต้นปัจจุบัน: <span className="font-bold">฿{currentCash.toLocaleString()}</span>
                        </p>
                    </div>
                )}

                <div className="mb-5">
                    <label className="text-sm font-medium text-gray-600 mb-2 block">จำนวนเงิน (บาท)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">฿</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-2xl font-bold focus:outline-none focus:border-emerald-400 transition-colors text-right"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                    {presets.map((preset) => (
                        <button
                            key={preset}
                            onClick={() => setAmount(String(preset))}
                            className="py-3 rounded-xl border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 font-bold text-sm transition-all"
                        >
                            ฿{preset.toLocaleString()}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => {
                        const val = parseFloat(amount);
                        if (val > 0) {
                            onConfirm(val);
                            setAmount("");
                        }
                    }}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl transition-all text-lg"
                >
                    ยืนยันเงินเริ่มต้น
                </button>
            </div>
        </div>
    );
};

/** Modal ชำระเงิน */
const PaymentModal = ({
    isOpen,
    onClose,
    order,
    onConfirm,
    loading,
}: {
    isOpen: boolean;
    onClose: () => void;
    order: OrderData | null;
    onConfirm: (orderId: string, receivedAmount: number) => void;
    loading: boolean;
}) => {
    const [received, setReceived] = useState("");

    if (!isOpen || !order) return null;

    const total = Number(order.totalPrice);
    const receivedNum = parseFloat(received) || 0;
    const change = receivedNum - total;

    const quickAmounts = [
        Math.ceil(total / 100) * 100,
        Math.ceil(total / 500) * 500,
        Math.ceil(total / 1000) * 1000,
    ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">ชำระเงิน</h2>
                            <p className="text-sm text-gray-400">โต๊ะ #{order.table.tableNo}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-5 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <span className="text-gray-600">
                                        {item.menuItemName} x{item.quantity}
                                    </span>
                                    {item.optionsText && (
                                        <p className="text-xs text-gray-400 truncate">{item.optionsText}</p>
                                    )}
                                </div>
                                <span className="font-medium whitespace-nowrap">฿{Number(item.price).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
                        <span className="font-bold text-lg">รวมทั้งหมด</span>
                        <span className="font-black text-xl text-orange-600">฿{total.toLocaleString()}</span>
                    </div>
                </div>

                {/* Received Amount */}
                <div className="mb-4">
                    <label className="text-sm font-medium text-gray-600 mb-2 block">เงินที่รับ (บาท)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">฿</span>
                        <input
                            type="number"
                            value={received}
                            onChange={(e) => setReceived(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-2xl font-bold focus:outline-none focus:border-blue-400 transition-colors text-right"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2 mb-5">
                    {quickAmounts.map((amt) => (
                        <button
                            key={amt}
                            onClick={() => setReceived(String(amt))}
                            className="flex-1 py-2.5 rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50 font-bold text-sm transition-all"
                        >
                            ฿{amt.toLocaleString()}
                        </button>
                    ))}
                    <button
                        onClick={() => setReceived(String(total))}
                        className="flex-1 py-2.5 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-600 font-bold text-sm transition-all"
                    >
                        พอดี
                    </button>
                </div>

                {/* Change display */}
                {receivedNum > 0 && (
                    <div
                        className={`rounded-2xl p-4 mb-5 flex items-center justify-between ${change >= 0 ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <HandCoins size={20} className={change >= 0 ? "text-emerald-600" : "text-red-500"} />
                            <span className={`font-medium text-sm ${change >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                                {change >= 0 ? "เงินทอน" : "เงินไม่พอ"}
                            </span>
                        </div>
                        <span
                            className={`text-2xl font-black ${change >= 0 ? "text-emerald-600" : "text-red-500"
                                }`}
                        >
                            ฿{Math.abs(change).toLocaleString()}
                        </span>
                    </div>
                )}

                {/* Confirm button */}
                <button
                    onClick={() => {
                        onConfirm(order.id, receivedNum);
                        setReceived("");
                    }}
                    disabled={loading || change < 0 || receivedNum <= 0}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl transition-all text-lg flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            กำลังดำเนินการ...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={20} />
                            ยืนยันชำระเงิน
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// ============ Main Component ============
export const StaffOrderManagement = () => {
    // State
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // เงินเริ่มต้น (Starting Cash)
    const [startingCash, setStartingCash] = useState<number>(0);
    const [cashReceived, setCashReceived] = useState<number>(0);
    const [changeGiven, setChangeGiven] = useState<number>(0);
    const [showCashModal, setShowCashModal] = useState(false);

    // Payment modal
    const [paymentOrder, setPaymentOrder] = useState<OrderData | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Custom Modals State
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [errorAlert, setErrorAlert] = useState<string | null>(null);

    // โหลดค่าจาก localStorage
    useEffect(() => {
        const saved = localStorage.getItem("pos_cash_drawer");
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setStartingCash(data.startingCash || 0);
                setCashReceived(data.cashReceived || 0);
                setChangeGiven(data.changeGiven || 0);
            } catch {
                // ignore
            }
        }
    }, []);

    // บันทึกลง localStorage ทุกครั้งที่เงินเปลี่ยน
    useEffect(() => {
        localStorage.setItem(
            "pos_cash_drawer",
            JSON.stringify({ startingCash, cashReceived, changeGiven })
        );
    }, [startingCash, cashReceived, changeGiven]);

    // ดึงข้อมูลออเดอร์
    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch("/api/orders");
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        // Auto-refresh ทุก 15 วินาที
        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    // ตั้งเงินเริ่มต้น
    const handleSetStartingCash = (amount: number) => {
        setStartingCash(amount);
        setCashReceived(0);
        setChangeGiven(0);
        setShowCashModal(false);
    };

    // Reset กะ
    const handleResetShift = () => {
        setStartingCash(0);
        setCashReceived(0);
        setChangeGiven(0);
        localStorage.removeItem("pos_cash_drawer");
        setShowResetConfirm(false);
    };

    // ชำระเงิน
    const handlePayment = async (orderId: string, receivedAmount: number) => {
        setPaymentLoading(true);
        try {
            const order = orders.find((o) => o.id === orderId);
            if (!order) return;

            const total = Number(order.totalPrice);
            const change = receivedAmount - total;

            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status: "PAID" }),
            });

            if (res.ok) {
                // อัพเดทเงินในลิ้นชัก
                setCashReceived((prev) => prev + receivedAmount);
                setChangeGiven((prev) => prev + change);

                setShowPaymentModal(false);
                setPaymentOrder(null);
                fetchOrders();
            }
        } catch (error) {
            console.error("Payment failed:", error);
        } finally {
            setPaymentLoading(false);
        }
    };

    // อัพเดทสถานะของแต่ละรายการอาหาร
    const updateItemStatus = async (itemId: string, newStatus: string) => {
        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId, itemStatus: newStatus }),
            });
            if (res.ok) fetchOrders();
        } catch (error) {
            console.error("Failed to update item status:", error);
        }
    };

    // คำนวณเงินในลิ้นชัก
    const currentDrawer = startingCash + cashReceived - changeGiven;
    const paidCount = cashReceived > 0 ? Math.round(cashReceived / 100) : 0; // rough estimate

    // ลบรายการอาหาร (DELETE)
    const deleteItem = async () => {
        if (!itemToDelete) return;

        try {
            const res = await fetch(`/api/orders?itemId=${itemToDelete}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchOrders();
            } else {
                setErrorAlert("เกิดข้อผิดพลาดในการลบรายการ");
            }
        } catch (error) {
            console.error("Failed to delete item:", error);
            setErrorAlert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
        } finally {
            setItemToDelete(null);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            {/* ======= Summary Cards ======= */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <SummaryCard
                    label="เงินเริ่มต้น"
                    value={`฿${startingCash.toLocaleString()}`}
                    icon={Wallet}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <SummaryCard
                    label="เงินสดที่รับ"
                    value={`฿${cashReceived.toLocaleString()}`}
                    icon={Banknote}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <SummaryCard
                    label="เงินทอนที่จ่าย"
                    value={`฿${changeGiven.toLocaleString()}`}
                    icon={ArrowDownUp}
                    color="text-orange-600"
                    bg="bg-orange-50"
                />
                <SummaryCard
                    label="เงินในลิ้นชักตอนนี้"
                    value={`฿${currentDrawer.toLocaleString()}`}
                    icon={CircleDollarSign}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
            </div>

            {/* ======= Cash Drawer Actions ======= */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
                            <HandCoins size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">ลิ้นชักเงินสด</h3>
                            <p className="text-sm text-gray-400">
                                {startingCash > 0
                                    ? `ตั้งเงินเริ่มต้นไว้ ฿${startingCash.toLocaleString()}`
                                    : "ยังไม่ได้ตั้งเงินเริ่มต้น"}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCashModal(true)}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm"
                        >
                            <Wallet size={16} />
                            {startingCash > 0 ? "แก้ไขเงินเริ่มต้น" : "ตั้งเงินเริ่มต้น"}
                        </button>
                        {startingCash > 0 && (
                            <button
                                onClick={() => setShowResetConfirm(true)}
                                className="px-5 py-2.5 border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 font-bold rounded-xl transition-all flex items-center gap-2 text-sm text-gray-500"
                            >
                                <RotateCcw size={16} />
                                เริ่มกะใหม่
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ======= Active Orders ======= */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-50 text-orange-600 p-3 rounded-2xl">
                            <ShoppingBag size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">ออเดอร์ที่รอชำระ</h3>
                            <p className="text-sm text-gray-400">
                                {orders.length} รายการที่เปิดอยู่
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setLoading(true); fetchOrders(); }}
                        className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                        title="รีเฟรชข้อมูล"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Loader2 size={36} className="animate-spin mb-3" />
                        <p className="text-sm">กำลังโหลดออเดอร์...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                        <Receipt size={48} className="mb-3" />
                        <p className="font-bold text-gray-400">ยังไม่มีออเดอร์ที่เปิดอยู่</p>
                        <p className="text-sm text-gray-300 mt-1">ออเดอร์ใหม่จะปรากฏที่นี่โดยอัตโนมัติ</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="border-2 border-gray-100 hover:border-orange-200 rounded-2xl p-5 transition-all hover:shadow-md group"
                            >
                                {/* Order Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                            <Hash size={20} className="text-orange-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">โต๊ะ #{order.table.tableNo}</h4>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                <Clock size={12} />
                                                <span>{formatTime(order.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'OPEN' ? 'bg-blue-100 text-blue-600' :
                                        order.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {order.status === 'OPEN' ? 'รอชำระเงิน' : order.status === 'PAID' ? 'จ่ายแล้ว' : 'ยกเลิก'}
                                    </span>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-2">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-700 truncate max-w-[140px]">
                                                        {item.menuItemName}
                                                        <span className="text-gray-400 font-normal ml-1 flex-shrink-0">x{item.quantity}</span>
                                                    </span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${item.status === 'SERVED' ? 'bg-emerald-100 text-emerald-600' :
                                                        item.status === 'COOKING' ? 'bg-blue-100 text-blue-600' :
                                                            item.status === 'CANCELLED' ? 'bg-red-100 text-red-500' :
                                                                'bg-amber-100 text-amber-600'
                                                        }`}>
                                                        {item.status === 'PENDING' ? 'รอรับ' : item.status === 'COOKING' ? 'กำลังทำ' : item.status === 'SERVED' ? 'เสิร์ฟแล้ว' : 'ยกเลิก'}
                                                    </span>
                                                </div>
                                                {item.optionsText && (
                                                    <p className="text-xs text-gray-500 mb-2 truncate">{item.optionsText}</p>
                                                )}

                                                {/* Action buttons for items */}
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    {item.status === 'PENDING' && (
                                                        <button onClick={() => updateItemStatus(item.id, 'COOKING')} className="text-[11px] font-bold bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                                                            รับออเดอร์
                                                        </button>
                                                    )}
                                                    {item.status === 'COOKING' && (
                                                        <button onClick={() => updateItemStatus(item.id, 'SERVED')} className="text-[11px] font-bold bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm">
                                                            เสิร์ฟแล้ว
                                                        </button>
                                                    )}
                                                    {item.status !== 'SERVED' && (
                                                        <button onClick={() => setItemToDelete(item.id)} className="text-[11px] font-bold bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg ml-auto transition-colors border border-red-100 shadow-sm flex items-center gap-1">
                                                            <X size={12} />
                                                            ยกเลิกและลบทิ้ง
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="font-bold whitespace-nowrap text-orange-600 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                                                ฿{Number(item.price).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Footer */}
                                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400">ยอดรวม</p>
                                        <p className="text-xl font-black text-orange-600">
                                            ฿{Number(order.totalPrice).toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setPaymentOrder(order);
                                            setShowPaymentModal(true);
                                        }}
                                        className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm opacity-80 group-hover:opacity-100"
                                    >
                                        <Banknote size={16} />
                                        ชำระเงิน
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ======= Modals ======= */}
            <StartingCashModal
                isOpen={showCashModal}
                onClose={() => setShowCashModal(false)}
                onConfirm={handleSetStartingCash}
                currentCash={startingCash}
            />

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setPaymentOrder(null);
                }}
                order={paymentOrder}
                onConfirm={handlePayment}
                loading={paymentLoading}
            />

            <ConfirmModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={handleResetShift}
                title="ยืนยันการเริ่มกะใหม่"
                description="คุณต้องการเคลียร์ลิ้นชักเงินสดและเริ่มกะใหม่ใช่หรือไม่? ยอดเงินเริ่มต้นจะถูกรีเซ็ตเป็น 0"
                confirmText="ตกลง, เริ่มกะใหม่"
                isDestructive={true}
            />

            <ConfirmModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={deleteItem}
                title="ยืนยันการลบออเดอร์"
                description="คุณต้องการยกเลิกและลบออเดอร์จานนี้ออกทิ้งใช่หรือไม่? ยอดเงินในบิลจะถูกหักออก"
                confirmText="ลบทิ้ง"
                isDestructive={true}
            />

            <AlertModal
                isOpen={!!errorAlert}
                onClose={() => setErrorAlert(null)}
                title="เกิดข้อผิดพลาด"
                description={errorAlert || "กรุณาลองใหม่อีกครั้ง"}
            />
        </div>
    );
};
