import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
    id: string;
    icon: LucideIcon;
    label: string;
    activeTab: string;
    setActiveTab: (id: string) => void;
    sidebarOpen: boolean;
}

export const SidebarItem = ({ id, icon: Icon, label, activeTab, setActiveTab, sidebarOpen }: SidebarItemProps) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
            : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'
            }`}
    >
        <Icon size={20} />
        <span className={`font-medium ${!sidebarOpen && 'hidden'}`}>{label}</span>
    </button>
);
