"use client";

import { useState, useEffect } from "react";
import {
    Plus, X, Loader2, AlertCircle, Trash2,
    ChefHat, Search, ToggleLeft, ToggleRight,
    Coffee, Utensils, IceCreamCone, ImageIcon, Settings2
} from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing";

interface MenuOption {
    id: string;
    groupName: string;
    name: string;
    additionalPrice: number;
}

interface MenuItem {
    id: string;
    name: string;
    category: string;
    image: string | null;
    basePrice: number;
    isAvailable: boolean;
    options: MenuOption[];
}

interface NewOption {
    groupName: string;
    name: string;
    additionalPrice: string;
}

const CATEGORIES = [
    { value: "อาหาร", label: "อาหาร", icon: Utensils, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { value: "เครื่องดื่ม", label: "เครื่องดื่ม", icon: Coffee, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { value: "ทานเล่น", label: "ทานเล่น", icon: IceCreamCone, color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
];

export const MenuManagement = () => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("ทั้งหมด");

    // Add form state
    const [formName, setFormName] = useState("");
    const [formCategory, setFormCategory] = useState("อาหาร");
    const [formPrice, setFormPrice] = useState("");
    const [formImage, setFormImage] = useState("");
    const [formOptions, setFormOptions] = useState<NewOption[]>([]);

    // Detail modal state
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [toggling, setToggling] = useState(false);

    // Add option inline (detail modal)
    const [showAddOption, setShowAddOption] = useState(false);
    const [newOptGroup, setNewOptGroup] = useState("");
    const [newOptName, setNewOptName] = useState("");
    const [newOptPrice, setNewOptPrice] = useState("");
    const [addingOption, setAddingOption] = useState(false);

    const fetchMenuItems = async () => {
        try {
            const res = await fetch("/api/menu");
            if (res.ok) {
                const data = await res.json();
                setMenuItems(data);
            }
        } catch (err) {
            console.error("ไม่สามารถดึงข้อมูลเมนูได้", err);
        }
    };

    useEffect(() => {
        fetchMenuItems();
    }, []);

    const handleAddMenu = async () => {
        if (!formName || !formCategory || !formPrice) {
            setError("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/menu", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formName,
                    category: formCategory,
                    basePrice: parseFloat(formPrice),
                    image: formImage || null,
                    options: formOptions
                        .filter((o) => o.groupName && o.name)
                        .map((o) => ({
                            groupName: o.groupName,
                            name: o.name,
                            additionalPrice: parseFloat(o.additionalPrice) || 0,
                        })),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "เกิดข้อผิดพลาด");
                setLoading(false);
                return;
            }

            setShowAddModal(false);
            resetForm();
            fetchMenuItems();
        } catch {
            setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem) return;
        setDeleting(true);
        setDeleteError("");

        try {
            const res = await fetch(`/api/menu?id=${selectedItem.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) {
                setDeleteError(data.error || "เกิดข้อผิดพลาด");
                setDeleting(false);
                return;
            }
            closeDetailModal();
            fetchMenuItems();
        } catch {
            setDeleteError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleAvailable = async (item: MenuItem) => {
        setToggling(true);
        try {
            const res = await fetch("/api/menu", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.id, isAvailable: !item.isAvailable }),
            });
            if (res.ok) {
                fetchMenuItems();
                if (selectedItem?.id === item.id) {
                    setSelectedItem({ ...item, isAvailable: !item.isAvailable });
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setToggling(false);
        }
    };

    const handleAddOptionInline = async () => {
        if (!selectedItem || !newOptGroup || !newOptName) return;
        setAddingOption(true);
        try {
            const res = await fetch("/api/menu/options", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    menuItemId: selectedItem.id,
                    groupName: newOptGroup,
                    name: newOptName,
                    additionalPrice: parseFloat(newOptPrice) || 0,
                }),
            });
            if (res.ok) {
                setNewOptGroup("");
                setNewOptName("");
                setNewOptPrice("");
                setShowAddOption(false);
                // refresh
                const updated = await fetch("/api/menu");
                if (updated.ok) {
                    const all: MenuItem[] = await updated.json();
                    setMenuItems(all);
                    setSelectedItem(all.find((m) => m.id === selectedItem.id) || null);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAddingOption(false);
        }
    };

    const handleDeleteOption = async (optionId: string) => {
        try {
            const res = await fetch(`/api/menu/options?id=${optionId}`, { method: "DELETE" });
            if (res.ok && selectedItem) {
                const updated = await fetch("/api/menu");
                if (updated.ok) {
                    const all: MenuItem[] = await updated.json();
                    setMenuItems(all);
                    setSelectedItem(all.find((m) => m.id === selectedItem.id) || null);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormName("");
        setFormCategory("อาหาร");
        setFormPrice("");
        setFormImage("");
        setFormOptions([]);
        setError("");
    };

    const openDetailModal = (item: MenuItem) => {
        setSelectedItem(item);
        setShowDetailModal(true);
        setDeleteConfirm(false);
        setDeleteError("");
        setShowAddOption(false);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedItem(null);
        setDeleteConfirm(false);
        setDeleteError("");
        setShowAddOption(false);
    };

    const getCategoryConfig = (category: string) => {
        return CATEGORIES.find((c) => c.value === category) || CATEGORIES[0];
    };

    // Group options by groupName
    const groupOptions = (options: MenuOption[]) => {
        const groups: Record<string, MenuOption[]> = {};
        options.forEach((opt) => {
            if (!groups[opt.groupName]) groups[opt.groupName] = [];
            groups[opt.groupName].push(opt);
        });
        return groups;
    };

    const addFormOption = () => {
        setFormOptions([...formOptions, { groupName: "", name: "", additionalPrice: "0" }]);
    };

    const updateFormOption = (index: number, field: keyof NewOption, value: string) => {
        const updated = [...formOptions];
        updated[index][field] = value;
        setFormOptions(updated);
    };

    const removeFormOption = (index: number) => {
        setFormOptions(formOptions.filter((_, i) => i !== index));
    };

    // Filtered items
    const filteredItems = menuItems.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "ทั้งหมด" || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-[#f96302] p-2 rounded-xl shadow-lg shadow-[#f96302]/20 text-white">
                                <ChefHat size={24} />
                            </div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">จัดการเมนู</h1>
                        </div>
                        <p className="text-gray-400 text-sm">เพิ่ม ลบ และจัดการเมนูอาหารภายในร้าน</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center bg-[#1c1c1c] border border-white/5 rounded-2xl py-3 px-2">
                            <div className="flex flex-col items-center px-6 border-r border-white/10">
                                <span className="text-xs text-gray-500 mb-1">ทั้งหมด</span>
                                <span className="text-xl font-bold text-white">{menuItems.length}</span>
                            </div>
                            <div className="flex flex-col items-center px-6 border-r border-white/10">
                                <span className="text-xs text-gray-500 mb-1">เปิดขาย</span>
                                <span className="text-xl font-bold text-emerald-500">{menuItems.filter((i) => i.isAvailable).length}</span>
                            </div>
                            <div className="flex flex-col items-center px-6">
                                <span className="text-xs text-gray-500 mb-1">ปิดขาย</span>
                                <span className="text-xl font-bold text-red-400">{menuItems.filter((i) => !i.isAvailable).length}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => { setShowAddModal(true); setError(""); }}
                            className="flex items-center gap-2 bg-[#f96302] hover:bg-[#e05802] text-white px-6 py-4 rounded-2xl font-medium transition-colors shadow-lg shadow-[#f96302]/20 w-full sm:w-auto justify-center md:h-full"
                        >
                            <Plus size={20} />
                            เพิ่มเมนู
                        </button>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาเมนู..."
                            className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f96302]/50 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFilterCategory("ทั้งหมด")}
                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${filterCategory === "ทั้งหมด" ? "bg-[#f96302] text-white" : "bg-[#1c1c1c] text-gray-400 border border-white/5 hover:border-white/10"}`}
                        >
                            ทั้งหมด
                        </button>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setFilterCategory(cat.value)}
                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${filterCategory === cat.value ? "bg-[#f96302] text-white" : "bg-[#1c1c1c] text-gray-400 border border-white/5 hover:border-white/10"}`}
                            >
                                <cat.icon size={16} />
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map((item) => {
                        const catConfig = getCategoryConfig(item.category);
                        return (
                            <div
                                key={item.id}
                                onClick={() => openDetailModal(item)}
                                className={`bg-[#1c1c1c] border rounded-[24px] overflow-hidden transition-all cursor-pointer group active:scale-[0.97] ${item.isAvailable ? "border-white/5 hover:border-white/10" : "border-red-500/10 hover:border-red-500/20 opacity-60"}`}
                            >
                                <div className="aspect-4/3 bg-[#141414] flex items-center justify-center relative overflow-hidden">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <ImageIcon size={48} className="text-[#2a2a2a]" />
                                    )}
                                    <div className={`absolute top-3 left-3 flex items-center gap-1.5 ${catConfig.bg} ${catConfig.color} px-3 py-1 rounded-full text-xs font-medium border ${catConfig.border}`}>
                                        <catConfig.icon size={12} />
                                        {item.category}
                                    </div>
                                    {!item.isAvailable && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="text-red-400 font-bold text-sm bg-red-400/10 border border-red-400/20 px-4 py-2 rounded-full">ปิดขาย</span>
                                        </div>
                                    )}
                                    {/* Options count badge */}
                                    {item.options?.length > 0 && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-medium">
                                            <Settings2 size={10} />
                                            {item.options.length}
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="text-white font-bold text-lg mb-1 truncate">{item.name}</h3>
                                    <p className="text-[#f96302] font-bold text-xl">฿{Number(item.basePrice).toLocaleString()}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <ChefHat size={48} className="mb-4 text-[#2a2a2a]" />
                        <p className="text-lg font-medium">ไม่พบเมนู</p>
                        <p className="text-sm text-gray-600 mt-1">ลองเปลี่ยนตัวกรองหรือเพิ่มเมนูใหม่</p>
                    </div>
                )}
            </div>

            {/* ===== Detail Modal ===== */}
            {showDetailModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeDetailModal}>
                    <div className="bg-[#1c1c1c] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <button onClick={closeDetailModal} className="absolute top-4 right-4 z-10 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-black/20 bg-black/30">
                            <X size={20} />
                        </button>

                        {/* Image */}
                        <div className="aspect-video bg-[#141414] flex items-center justify-center relative shrink-0">
                            {selectedItem.image ? (
                                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon size={64} className="text-[#2a2a2a]" />
                            )}
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto flex-1">
                            {/* Title & Price */}
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">{selectedItem.name}</h2>
                                <p className="text-[#f96302] font-bold text-2xl">฿{Number(selectedItem.basePrice).toLocaleString()}</p>
                            </div>

                            {/* Info */}
                            <div className="space-y-3">
                                {(() => {
                                    const catConfig = getCategoryConfig(selectedItem.category);
                                    return (
                                        <div className="flex items-center justify-between bg-[#141414] rounded-xl px-4 py-3 border border-white/5">
                                            <span className="text-gray-400 text-sm">หมวดหมู่</span>
                                            <div className={`flex items-center gap-1.5 ${catConfig.color} text-sm font-medium`}>
                                                <catConfig.icon size={14} />
                                                {selectedItem.category}
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div className="flex items-center justify-between bg-[#141414] rounded-xl px-4 py-3 border border-white/5">
                                    <span className="text-gray-400 text-sm">สถานะ</span>
                                    <button onClick={() => handleToggleAvailable(selectedItem)} disabled={toggling} className="flex items-center gap-2 transition-all">
                                        {selectedItem.isAvailable ? (
                                            <>
                                                <span className="text-emerald-500 text-sm font-medium">เปิดขาย</span>
                                                <ToggleRight size={24} className="text-emerald-500" />
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-red-400 text-sm font-medium">ปิดขาย</span>
                                                <ToggleLeft size={24} className="text-red-400" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Options Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-white font-semibold text-sm">ตัวเลือก ({selectedItem.options?.length || 0})</h3>
                                    <button
                                        onClick={() => setShowAddOption(!showAddOption)}
                                        className="flex items-center gap-1 text-xs text-[#f96302] hover:text-[#e05802] transition-colors font-medium"
                                    >
                                        <Plus size={14} />
                                        เพิ่ม
                                    </button>
                                </div>

                                {/* Add Option Form */}
                                {showAddOption && (
                                    <div className="bg-[#141414] rounded-xl p-4 border border-white/5 mb-3 space-y-3">
                                        <input
                                            type="text"
                                            value={newOptGroup}
                                            onChange={(e) => setNewOptGroup(e.target.value)}
                                            placeholder='ชื่อกลุ่ม เช่น "เลือกเส้น"'
                                            className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f96302]/50"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newOptName}
                                                onChange={(e) => setNewOptName(e.target.value)}
                                                placeholder="ชื่อตัวเลือก"
                                                className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f96302]/50"
                                            />
                                            <input
                                                type="number"
                                                value={newOptPrice}
                                                onChange={(e) => setNewOptPrice(e.target.value)}
                                                placeholder="+฿"
                                                className="w-20 bg-[#1c1c1c] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f96302]/50"
                                                min={0}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowAddOption(false)} className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-all">
                                                ยกเลิก
                                            </button>
                                            <button
                                                onClick={handleAddOptionInline}
                                                disabled={addingOption || !newOptGroup || !newOptName}
                                                className="flex-1 flex items-center justify-center gap-1 bg-[#f96302] hover:bg-[#e05802] disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                {addingOption ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                                เพิ่ม
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Options List Grouped */}
                                {selectedItem.options?.length > 0 ? (
                                    <div className="space-y-3">
                                        {Object.entries(groupOptions(selectedItem.options)).map(([groupName, opts]) => (
                                            <div key={groupName} className="bg-[#141414] rounded-xl border border-white/5 overflow-hidden">
                                                <div className="px-4 py-2 border-b border-white/5">
                                                    <span className="text-xs text-gray-500 font-medium">{groupName}</span>
                                                </div>
                                                {opts.map((opt) => (
                                                    <div key={opt.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-all group/opt">
                                                        <span className="text-white text-sm">{opt.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-gray-400 text-sm">
                                                                {Number(opt.additionalPrice) > 0 ? `+฿${Number(opt.additionalPrice).toLocaleString()}` : "ฟรี"}
                                                            </span>
                                                            <button
                                                                onClick={() => handleDeleteOption(opt.id)}
                                                                className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover/opt:opacity-100"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-600 text-sm">ยังไม่มีตัวเลือก</div>
                                )}
                            </div>

                            {/* Delete Error */}
                            {deleteError && (
                                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
                                    <AlertCircle size={16} />
                                    <span>{deleteError}</span>
                                </div>
                            )}

                            {/* Delete */}
                            {!deleteConfirm ? (
                                <button onClick={() => setDeleteConfirm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all font-medium">
                                    <Trash2 size={16} />
                                    ลบเมนู
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-center text-sm text-red-400 bg-red-400/5 border border-red-400/10 rounded-xl px-4 py-3">
                                        ⚠️ ยืนยันการลบเมนู &quot;{selectedItem.name}&quot; ?
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setDeleteConfirm(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all font-medium">
                                            ยกเลิก
                                        </button>
                                        <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-medium transition-colors">
                                            {deleting ? (<><Loader2 size={16} className="animate-spin" />กำลังลบ...</>) : (<><Trash2 size={16} />ยืนยันลบ</>)}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Add Menu Modal ===== */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                    <div className="bg-[#1c1c1c] border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-[#f96302] p-2 rounded-xl text-white">
                                <Plus size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white">เพิ่มเมนูใหม่</h2>
                        </div>

                        <div className="space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">ชื่อเมนู</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => { setFormName(e.target.value); setError(""); }}
                                    placeholder="เช่น กะเพราหมูสับ"
                                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f96302] focus:ring-1 focus:ring-[#f96302]/30 transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">หมวดหมู่</label>
                                <div className="flex gap-2">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => setFormCategory(cat.value)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${formCategory === cat.value ? "bg-[#f96302] text-white" : "bg-[#141414] text-gray-400 border border-white/10 hover:border-white/20"}`}
                                        >
                                            <cat.icon size={16} />
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">ราคา (บาท)</label>
                                <input
                                    type="number"
                                    value={formPrice}
                                    onChange={(e) => { setFormPrice(e.target.value); setError(""); }}
                                    placeholder="0.00"
                                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f96302] focus:ring-1 focus:ring-[#f96302]/30 transition-all text-lg"
                                    min={0}
                                    step="0.01"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">รูปภาพ</label>
                                {formImage ? (
                                    <div className="relative rounded-xl overflow-hidden border border-white/10">
                                        <img src={formImage} alt="preview" className="w-full aspect-video object-cover" />
                                        <button
                                            onClick={() => setFormImage("")}
                                            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <UploadDropzone
                                        endpoint="menuImageUploader"
                                        onClientUploadComplete={(res) => {
                                            if (res?.[0]) {
                                                setFormImage(res[0].ufsUrl);
                                            }
                                        }}
                                        onUploadError={(error: Error) => {
                                            setError(`อัพโหลดรูปไม่สำเร็จ: ${error.message}`);
                                        }}
                                        config={{ mode: "auto" }}
                                        appearance={{
                                            container: "border-2 border-dashed border-white/10 bg-[#141414] rounded-xl py-8 hover:border-[#f96302]/30 transition-colors ut-uploading:border-[#f96302]/50 cursor-pointer",
                                            label: "text-gray-400 hover:text-white transition-colors cursor-pointer",
                                            allowedContent: "text-gray-600 text-xs",
                                            button: "hidden",
                                        }}
                                    />
                                )}
                            </div>

                            {/* Options */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-400">ตัวเลือก (Options)</label>
                                    <button
                                        type="button"
                                        onClick={addFormOption}
                                        className="flex items-center gap-1 text-xs text-[#f96302] hover:text-[#e05802] transition-colors font-medium"
                                    >
                                        <Plus size={14} />
                                        เพิ่มตัวเลือก
                                    </button>
                                </div>

                                {formOptions.length > 0 ? (
                                    <div className="space-y-3">
                                        {formOptions.map((opt, i) => (
                                            <div key={i} className="bg-[#141414] rounded-xl p-3 border border-white/5 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={opt.groupName}
                                                        onChange={(e) => updateFormOption(i, "groupName", e.target.value)}
                                                        placeholder='กลุ่ม เช่น "เลือกเส้น"'
                                                        className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f96302]/50"
                                                    />
                                                    <button onClick={() => removeFormOption(i)} className="text-gray-600 hover:text-red-400 p-1 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={opt.name}
                                                        onChange={(e) => updateFormOption(i, "name", e.target.value)}
                                                        placeholder="ชื่อตัวเลือก"
                                                        className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f96302]/50"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={opt.additionalPrice}
                                                        onChange={(e) => updateFormOption(i, "additionalPrice", e.target.value)}
                                                        placeholder="+฿"
                                                        className="w-24 bg-[#1c1c1c] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f96302]/50"
                                                        min={0}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-600 text-sm bg-[#141414] rounded-xl border border-white/5">
                                        ยังไม่มีตัวเลือก — กด &quot;เพิ่มตัวเลือก&quot; เพื่อเพิ่ม
                                    </div>
                                )}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2">
                                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all font-medium">
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleAddMenu}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#f96302] hover:bg-[#e05802] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-[#f96302]/20"
                                >
                                    {loading ? (<><Loader2 size={18} className="animate-spin" />กำลังเพิ่ม...</>) : (<><Plus size={18} />เพิ่มเมนู</>)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
