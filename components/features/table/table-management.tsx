"use client";

import { useState, useEffect } from "react";
import { Plus, UtensilsCrossed, CheckCircle2, X, Loader2, AlertCircle, Trash2, Hash, Info, Copy, QrCode } from "lucide-react";

interface Table {
    id: string;
    tableNo: number;
    status: string;
    currentSessionToken?: string | null;
}

export const TableManagement = () => {
    const [showModal, setShowModal] = useState(false);
    const [tableNo, setTableNo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [tables, setTables] = useState<Table[]>([]);

    // Detail Modal State
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // ดึงข้อมูลโต๊ะจาก API
    const fetchTables = async () => {
        try {
            const res = await fetch("/api/table");
            if (res.ok) {
                const data = await res.json();
                setTables(data);
            }
        } catch (err) {
            console.error("ไม่สามารถดึงข้อมูลโต๊ะได้", err);
        }
    };

    useEffect(() => {
        // ใช้ EventSource(SSE) แทนการ setInterval เพื่อรับข้อมูล Real-time
        const eventSource = new EventSource("/api/table/stream");

        eventSource.onmessage = (event) => {
            try {
                const updatedTables = JSON.parse(event.data);
                setTables(updatedTables);
            } catch (err) {
                console.error("Error parsing SSE data", err);
            }
        };

        eventSource.onerror = (error) => {
            console.error("SSE connection error, falling back to manual fetch", error);
            eventSource.close();
            // Fallback ถ้าระบบ Stream พัง ให้ดึงรอบนึง
            fetchTables();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const handleAddTable = async () => {
        if (!tableNo) {
            setError("กรุณาระบุเลขโต๊ะ");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/table", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tableNo: parseInt(tableNo) }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "เกิดข้อผิดพลาด");
                setLoading(false);
                return;
            }

            setShowModal(false);
            setTableNo("");
            setError("");
            fetchTables();
        } catch {
            setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTable = async () => {
        if (!selectedTable) return;

        setDeleting(true);
        setDeleteError("");

        try {
            const res = await fetch(`/api/table?id=${selectedTable.id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (!res.ok) {
                setDeleteError(data.error || "เกิดข้อผิดพลาด");
                setDeleting(false);
                return;
            }

            setShowDetailModal(false);
            setSelectedTable(null);
            setDeleteConfirm(false);
            fetchTables();
        } catch {
            setDeleteError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
        } finally {
            setDeleting(false);
        }
    };

    const openDetailModal = (table: Table) => {
        setSelectedTable(table);
        setShowDetailModal(true);
        setDeleteConfirm(false);
        setDeleteError("");
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedTable(null);
        setDeleteConfirm(false);
        setDeleteError("");
    };

    const availableCount = tables.filter((t) => t.status === "AVAILABLE").length;
    const occupiedCount = tables.length - availableCount;

    return (
        <>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-[#f96302] p-2 rounded-xl shadow-lg shadow-[#f96302]/20 text-white">
                                <UtensilsCrossed size={24} />
                            </div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">จัดการโต๊ะ</h1>
                        </div>
                        <p className="text-gray-400 text-sm">เพิ่ม ลบ และจัดการสถานะโต๊ะภายในร้าน</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Stats Summary */}
                        <div className="flex items-center bg-[#1c1c1c] border border-white/5 rounded-2xl py-3 px-2">
                            <div className="flex flex-col items-center px-6 border-r border-white/10">
                                <span className="text-xs text-gray-500 mb-1">ทั้งหมด</span>
                                <span className="text-xl font-bold text-white">{tables.length}</span>
                            </div>
                            <div className="flex flex-col items-center px-6 border-r border-white/10">
                                <span className="text-xs text-gray-500 mb-1">ว่าง</span>
                                <span className="text-xl font-bold text-emerald-500">{availableCount}</span>
                            </div>
                            <div className="flex flex-col items-center px-6">
                                <span className="text-xs text-gray-500 mb-1">ไม่ว่าง</span>
                                <span className="text-xl font-bold text-[#f96302]">{occupiedCount}</span>
                            </div>
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={() => {
                                setShowModal(true);
                                setError("");
                                setTableNo("");
                            }}
                            className="flex items-center gap-2 bg-[#f96302] hover:bg-[#e05802] text-white px-6 py-4 rounded-2xl font-medium transition-colors shadow-lg shadow-[#f96302]/20 w-full sm:w-auto justify-center md:h-full"
                        >
                            <Plus size={20} />
                            เพิ่มโต๊ะ
                        </button>
                    </div>
                </div>

                {/* Table Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                    {tables.map((table) => (
                        <div
                            key={table.id}
                            onClick={() => openDetailModal(table)}
                            className={`bg-[#1c1c1c] border rounded-[24px] p-10 flex flex-col items-center justify-center gap-6 transition-all cursor-pointer group aspect-5/4 active:scale-95 ${table.status === "AVAILABLE"
                                ? "border-white/5 hover:border-white/10"
                                : "border-[#f96302]/20 hover:border-[#f96302]/40"
                                }`}
                        >
                            {/* Table Number */}
                            <span className="text-7xl font-black text-[#404040] group-hover:text-[#505050] transition-colors tracking-tighter">
                                {table.tableNo}
                            </span>

                            {/* Status Badge */}
                            {table.status === "AVAILABLE" ? (
                                <div className="flex items-center gap-1.5 bg-[#141414] text-emerald-500 px-4 py-1.5 rounded-full text-sm font-medium border border-white/5">
                                    <CheckCircle2 size={16} />
                                    <span>ว่าง</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 bg-[#f96302]/10 text-[#f96302] px-4 py-1.5 rounded-full text-sm font-medium border border-[#f96302]/20">
                                    <AlertCircle size={16} />
                                    <span>ไม่ว่าง</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== Table Detail Modal ===== */}
            {showDetailModal && selectedTable && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={closeDetailModal}
                >
                    <div
                        className="bg-[#1c1c1c] border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeDetailModal}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                        >
                            <X size={20} />
                        </button>

                        {/* Big Table Number */}
                        <div className="flex flex-col items-center pt-4 pb-6">
                            <div className="w-24 h-24 rounded-3xl bg-[#141414] border border-white/5 flex items-center justify-center mb-4">
                                <span className="text-5xl font-black text-[#505050]">
                                    {selectedTable.tableNo}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">
                                โต๊ะที่ {selectedTable.tableNo}
                            </h2>

                            {/* Status Badge */}
                            {selectedTable.status === "AVAILABLE" ? (
                                <div className="flex items-center gap-1.5 text-emerald-500 px-4 py-1.5 rounded-full text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 mt-2">
                                    <CheckCircle2 size={16} />
                                    <span>ว่าง</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-[#f96302] px-4 py-1.5 rounded-full text-sm font-medium bg-[#f96302]/10 border border-[#f96302]/20 mt-2">
                                    <AlertCircle size={16} />
                                    <span>ไม่ว่าง</span>
                                </div>
                            )}
                        </div>

                        {/* Info Rows */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between bg-[#141414] rounded-xl px-4 py-3 border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Hash size={14} />
                                    <span>เลขโต๊ะ</span>
                                </div>
                                <span className="text-white font-semibold">{selectedTable.tableNo}</span>
                            </div>
                            <div className="flex items-center justify-between bg-[#141414] rounded-xl px-4 py-3 border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Info size={14} />
                                    <span>สถานะ</span>
                                </div>
                                <span className={`font-semibold ${selectedTable.status === "AVAILABLE" ? "text-emerald-500" : "text-[#f96302]"}`}>
                                    {selectedTable.status === "AVAILABLE" ? "ว่าง" : "ไม่ว่าง"}
                                </span>
                            </div>
                            {/* QR URL Row */}
                            <div className="bg-[#141414] rounded-xl px-4 py-3 border border-white/5 space-y-2">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <QrCode size={14} />
                                    <span>QR Code URL (สำหรับสร้าง QR)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-[#f96302] font-mono text-xs bg-black/30 rounded-lg px-2 py-1.5 truncate">
                                        /scan/{selectedTable.id}
                                    </code>
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/scan/${selectedTable.id}`;
                                            navigator.clipboard.writeText(url);
                                        }}
                                        title="คัดลอก URL"
                                        className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-600">URL นี้ใช้สร้าง QR Code สำหรับแต่ละโต๊ะ ลูกค้าจะไม่เห็นหมายเลขโต๊ะใน URL</p>
                            </div>
                        </div>

                        {/* Delete Error */}
                        {deleteError && (
                            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm mb-4">
                                <AlertCircle size={16} />
                                <span>{deleteError}</span>
                            </div>
                        )}

                        {/* Delete Section */}
                        {!deleteConfirm ? (
                            <button
                                onClick={() => setDeleteConfirm(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all font-medium"
                            >
                                <Trash2 size={16} />
                                ลบโต๊ะ
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-center text-sm text-red-400 bg-red-400/5 border border-red-400/10 rounded-xl px-4 py-3">
                                    ⚠️ ยืนยันการลบโต๊ะที่ {selectedTable.tableNo} ?
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setDeleteConfirm(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all font-medium"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        onClick={handleDeleteTable}
                                        disabled={deleting}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-medium transition-colors"
                                    >
                                        {deleting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                กำลังลบ...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={16} />
                                                ยืนยันลบ
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== Add Table Modal ===== */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-[#1c1c1c] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                        >
                            <X size={20} />
                        </button>

                        {/* Modal Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-[#f96302] p-2 rounded-xl text-white">
                                <Plus size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white">เพิ่มโต๊ะใหม่</h2>
                        </div>

                        {/* Form */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    เลขโต๊ะ
                                </label>
                                <input
                                    type="number"
                                    value={tableNo}
                                    onChange={(e) => {
                                        setTableNo(e.target.value);
                                        setError("");
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleAddTable();
                                    }}
                                    placeholder="ระบุเลขโต๊ะ เช่น 1, 2, 3..."
                                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f96302] focus:ring-1 focus:ring-[#f96302]/30 transition-all text-lg"
                                    autoFocus
                                    min={1}
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all font-medium"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleAddTable}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#f96302] hover:bg-[#e05802] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-[#f96302]/20"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            กำลังเพิ่ม...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={18} />
                                            เพิ่มโต๊ะ
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
