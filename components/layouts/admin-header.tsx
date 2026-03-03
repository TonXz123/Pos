import { Menu } from 'lucide-react';

interface HeaderProps {
    activeTab: string;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export const Header = ({ activeTab, sidebarOpen, setSidebarOpen }: HeaderProps) => {
    const today = new Date().toLocaleDateString('th-TH');
    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold capitalize">{
                        activeTab === 'dashboard' ? 'ยินดีต้อนรับ' :
                            activeTab === 'manage-order' ? 'จัดการสั่งซื้อ' :
                                activeTab === 'tables' ? 'จัดการโต๊ะ' :
                                    activeTab === 'menu' ? 'เมนูอาหาร' :
                                        activeTab === 'admin' ? 'จัดการผู้ดูแลระบบ' :
                                            activeTab
                    }</h2>
                    <p className="text-sm text-gray-500">{today}</p>
                </div>
            </div>
        </header>
    );
};
