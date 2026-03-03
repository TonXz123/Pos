"use client";

import { useEffect, useState } from 'react';
import {
    ClipboardList,
    DollarSign,
    Package
} from 'lucide-react';
import { SalesChart } from './sales-chart';

interface OrderQueueItem {
    id: string;
    menuItemName: string;
    optionsText?: string | null;
    quantity: number;
    status: string;
    createdAt: Date | string;
    tableNo: number;
}

interface TableData {
    id: number;
    tableNo: number;
    status: string;
    currentSessionToken?: string | null;
}

interface DashboardStats {
    totalSales: number;
    totalOrders: number;
    tables: {
        occupied: number;
        total: number;
    };
}

export const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        OPEN: 'bg-blue-100 text-blue-600',
        PAID: 'bg-green-100 text-green-600',
        CANCELLED: 'bg-red-100 text-red-600',
        AVAILABLE: 'bg-gray-100 text-gray-500',
        OCCUPIED: 'bg-orange-100 text-orange-600',
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
            {status}
        </span>
    );
};

export const DashboardTab = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [tables, setTables] = useState<TableData[]>([]);

    // Queue state
    const [orderQueue, setOrderQueue] = useState<OrderQueueItem[]>([]);
    const [queueLoading, setQueueLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch('/api/dashboard');
                const data = await res.json();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };
        const fetchTables = async () => {
            try {
                const res = await fetch('/api/table');
                if (res.ok) {
                    const data = await res.json();
                    setTables(data);
                }
            } catch (error) {
                console.error("Failed to fetch tables", error);
            }
        };
        const fetchQueue = async () => {
            try {
                const res = await fetch('/api/dashboard/queue');
                if (res.ok) {
                    const data = await res.json();
                    setOrderQueue(data);
                }
            } catch (error) {
                console.error("Failed to fetch queue", error);
            } finally {
                setQueueLoading(false);
            }
        };
        fetchDashboardData();
        fetchTables();
        fetchQueue();

        // Auto-refresh queue and tables every 10 seconds
        const interval = setInterval(() => {
            fetchTables();
            fetchQueue();
            fetchDashboardData();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        label: 'ยอดขายวันนี้',
                        value: `฿${stats?.totalSales?.toLocaleString() ?? 0}`,
                        icon: DollarSign,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50'
                    },
                    {
                        label: 'จำนวนออเดอร์',
                        value: stats?.totalOrders ?? 0,
                        icon: ClipboardList,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50'
                    },
                    {
                        label: 'โต๊ะที่ใช้งานอยู่',
                        value: `${stats?.tables?.occupied ?? 0} / ${stats?.tables?.total ?? 0}`,
                        icon: Package,
                        color: 'text-orange-600',
                        bg: 'bg-orange-50'
                    },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-black">{stat.value}</h3>
                            </div>
                            <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <SalesChart />

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[448px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">คิวออเดอร์ล่าสุด</h3>
                        <span className="bg-orange-100 text-orange-600 px-3 py-1 text-xs font-bold rounded-full">
                            {orderQueue.length} คิว
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {queueLoading ? (
                            <p className="text-sm text-gray-400 text-center py-4">กำลังโหลดคิว...</p>
                        ) : orderQueue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <ClipboardList size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">ไม่มีออเดอร์ค้าง</p>
                            </div>
                        ) : (
                            orderQueue.map((item, i) => (
                                <div key={item.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 relative">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                                        ${item.status === 'COOKING' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                        #{i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-sm text-gray-800 truncate">{item.menuItemName}</p>
                                            <span className="text-xs font-medium text-gray-400">x{item.quantity}</span>
                                        </div>
                                        {item.optionsText && (
                                            <p className="text-[11px] text-gray-500 truncate mb-1">{item.optionsText}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md">
                                                โต๊ะ {item.tableNo}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.status === 'COOKING' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                {item.status === 'COOKING' ? 'กำลังทำ' : 'ด่วน (รอทำ)'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-gray-400 whitespace-nowrap pt-1">
                                        {new Date(item.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Table Status */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">ผังโต๊ะอาหาร (Floor Plan)</h3>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                            <div className="w-2 h-2 rounded-full bg-gray-300" /> ว่าง
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                            <div className="w-2 h-2 rounded-full bg-orange-500" /> ไม่ว่าง
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {tables.map((table) => (
                        <div
                            key={table.id}
                            className={`aspect-square rounded-3xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${table.status === 'OCCUPIED'
                                ? 'bg-orange-50 border-orange-200 shadow-sm hover:shadow-orange-100'
                                : 'bg-white border-gray-100 hover:border-orange-200'
                                }`}
                        >
                            <span className="text-2xl font-black mb-1">#{table.tableNo}</span>
                            <StatusBadge status={table.status} />
                            {table.currentSessionToken && (
                                <span className="text-[10px] mt-2 text-gray-400 font-mono">{table.currentSessionToken.slice(0, 8)}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
