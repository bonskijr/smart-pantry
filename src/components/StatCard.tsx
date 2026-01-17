import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    type?: 'success' | 'warning' | 'danger' | 'neutral';
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, type = 'neutral', icon }) => {
    const getIconBgColor = () => {
        switch (type) {
            case 'success': return 'bg-emerald-500/10 text-emerald-400';
            case 'warning': return 'bg-amber-500/10 text-amber-400';
            case 'danger': return 'bg-red-500/10 text-red-400';
            default: return 'bg-primary/10 text-primary';
        }
    };

    const getTextColor = () => {
        switch (type) {
            case 'success': return 'text-emerald-400';
            case 'warning': return 'text-amber-400';
            case 'danger': return 'text-red-400';
            default: return 'text-white';
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/[0.08] group relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-30 ${type === 'success' ? 'bg-emerald-500' :
                    type === 'warning' ? 'bg-amber-500' :
                        type === 'danger' ? 'bg-red-500' : 'bg-primary'
                }`} />

            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">{title}</h3>
                    <p className={`text-4xl font-bold tracking-tight ${getTextColor()}`}>{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${getIconBgColor()} ring-1 ring-white/5`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
