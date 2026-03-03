"use client";

import {
    LayoutDashboard, Utensils, ClipboardList, Users, Settings, LogOut, Coffee, Package
} from 'lucide-react';
import { SidebarItem } from './sidebar-item';
import { signOut } from 'next-auth/react';

interface SidebarProps {
    sidebarOpen: boolean;
    activeTab: string;
    setActiveTab: (id: string) => void;
}

export const Sidebar = ({ sidebarOpen, activeTab, setActiveTab }: SidebarProps) => {
    return (
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} h-full bg-white border-r border-gray-200 transition-all p-4 flex flex-col overflow-y-auto`}>
            <div className="flex items-center gap-3 px-2 mb-8 overflow-hidden">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shrink-0">
                    <Utensils size={24} />
                </div>
                {sidebarOpen && <h1 className="font-bold text-xl tracking-tight whitespace-nowrap">POS System</h1>}
            </div>

            <nav className="flex-2 space-y-2">
                <SidebarItem id="dashboard" icon={LayoutDashboard} label="ภาพรวมระบบ" activeTab={activeTab} setActiveTab={setActiveTab} sidebarOpen={sidebarOpen} />
                <SidebarItem id="tables" icon={Package} label="จัดการโต๊ะ" activeTab={activeTab} setActiveTab={setActiveTab} sidebarOpen={sidebarOpen} />
                <SidebarItem id="menu" icon={Coffee} label="เมนูอาหาร" activeTab={activeTab} setActiveTab={setActiveTab} sidebarOpen={sidebarOpen} />
                <SidebarItem id="orders" icon={ClipboardList} label="รายการสั่งซื้อ" activeTab={activeTab} setActiveTab={setActiveTab} sidebarOpen={sidebarOpen} />
                <SidebarItem id="admin" icon={Users} label="จัดการผู้ดูแลระบบ" activeTab={activeTab} setActiveTab={setActiveTab} sidebarOpen={sidebarOpen} />
            </nav>

            <div className="pt-4 border-t border-gray-100">
                <SidebarItem id="settings" icon={Settings} label="ตั้งค่า" activeTab={activeTab} setActiveTab={setActiveTab} sidebarOpen={sidebarOpen} />
                <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl mt-2 transition-all"
                >
                    <LogOut size={20} />
                    {sidebarOpen && <span className="font-medium whitespace-nowrap">ออกจากระบบ</span>}
                </button>
            </div>
        </aside>
    );
};
