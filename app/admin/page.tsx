"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layouts/admin-sidebar';
import { Header } from '@/components/layouts/admin-header';
import { DashboardTab } from '@/components/features/dashboard/dashboard-tab';
import { TableManagement } from '@/components/features/table/table-management';
import { MenuManagement } from '@/components/features/menu/menu-management';
import { StaffOrderManagement } from '@/components/features/orders/staff-order';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // โหลดค่า activeTab จาก localStorage (client-side only)
    useEffect(() => {
        const saved = localStorage.getItem('activeTab');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (saved) setActiveTab(saved);
    }, []);

    // บันทึกค่าลง localStorage ทุกครั้งที่เปลี่ยน tab
    useEffect(() => {
        localStorage.setItem('activeTab', activeTab);
    }, [activeTab]);
    return (
        <div className="h-screen w-full bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
            <Sidebar
                sidebarOpen={sidebarOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* Main Content */}
            <main className="flex-1 h-full overflow-y-auto relative">
                <Header
                    activeTab={activeTab}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />
                <div className="p-8">
                    {activeTab === 'dashboard' && <DashboardTab />}
                    {activeTab === 'tables' && <TableManagement />}
                    {activeTab === 'menu' && <MenuManagement />}
                    {activeTab === 'orders' && <StaffOrderManagement />}
                </div>
            </main>
        </div>
    );
}
