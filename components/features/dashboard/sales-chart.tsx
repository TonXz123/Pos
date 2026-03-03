import React, { useState, useEffect } from "react";
import {
    CartesianGrid, Line, LineChart,
    BarChart, Bar,
    ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { Loader2 } from "lucide-react";

export const SalesChart = () => {
    const [chartType, setChartType] = useState('line');
    const [salesData, setSalesData] = useState<{ name: string, sales: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                const res = await fetch("/api/dashboard/sales");
                if (res.ok) {
                    const data = await res.json();
                    setSalesData(data);
                }
            } catch (error) {
                console.error("Failed to fetch sales data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSalesData();
    }, []);

    const getButtonClass = (type: string) => {
        const baseClass = "px-4 py-2 text-sm rounded-xl transition-all outline-none font-medium ";
        return type === chartType
            ? baseClass + "bg-orange-100 text-orange-600"
            : baseClass + "text-gray-500 hover:bg-orange-50 hover:text-orange-600 bg-transparent";
    };

    return (
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[448px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
                <h3 className="font-bold text-lg">สถิติยอดขายรายวัน</h3>
                <div className="flex gap-2 bg-gray-50 p-1 rounded-2xl">
                    <button onClick={() => setChartType('line')} className={getButtonClass('line')}>Line</button>
                    <button onClick={() => setChartType('bar')} className={getButtonClass('bar')}>Bar</button>
                </div>
            </div>

            <div className="flex-1 w-full relative min-h-0">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                ) : null}
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Line
                                type="monotone"
                                dataKey="sales"
                                stroke="#f97316"
                                strokeWidth={4}
                                dot={{ r: 6, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    ) : (
                        <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip cursor={{ fill: '#fff7ed' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="sales" fill="#f97316" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
