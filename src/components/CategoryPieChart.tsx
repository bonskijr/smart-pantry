import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PantryItem } from '../types/PantryItem';

interface CategoryPieChartProps {
    items: PantryItem[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ items }) => {
    const data = useMemo(() => {
        const categoryCounts: { [key: string]: number } = {};

        items.forEach(item => {
            const catName = item.category?.name || 'Uncategorized';
            categoryCounts[catName] = (categoryCounts[catName] || 0) + item.quantity;
        });

        return Object.entries(categoryCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [items]);

    const totalItems = useMemo(() => {
        return data.reduce((sum, entry) => sum + entry.value, 0);
    }, [data]);

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Inventory by Category</h3>

            {/* Chart Container */}
            <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                        >
                            {data.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    stroke="#fff"
                                    strokeWidth={2}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                color: '#1f2937',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                padding: '8px 12px'
                            }}
                            formatter={(value, name) => [
                                `${value} items (${((Number(value) / totalItems) * 100).toFixed(0)}%)`,
                                name
                            ]}
                            itemStyle={{ color: '#374151', fontWeight: 500 }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: 0, height: 200 }}>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-800">{totalItems}</div>
                        <div className="text-xs text-gray-500 font-medium">Total Items</div>
                    </div>
                </div>
            </div>

            {/* Custom Legend */}
            <div className="mt-4 space-y-2 max-h-[180px] overflow-y-auto">
                {data.map((entry, index) => (
                    <div
                        key={entry.name}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm text-gray-700 font-medium truncate">
                                {entry.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-sm font-semibold text-gray-800">
                                {entry.value}
                            </span>
                            <span className="text-xs text-gray-400 w-10 text-right">
                                {((entry.value / totalItems) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {data.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    No data available
                </div>
            )}
        </div>
    );
};

export default CategoryPieChart;