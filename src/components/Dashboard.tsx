import React, { useEffect, useState, useCallback, useRef } from 'react';
import ItemTable from './ItemTable';
import StatCard from './StatCard';
import AddItemModal from './AddItemModal';
import UpdateItemModal from './UpdateItemModal';
import ImportModal from './ImportModal';
import Toast from './Toast';
import type { PantryItem } from '../types/PantryItem';

const Dashboard: React.FC = () => {
    const [items, setItems] = useState<PantryItem[]>([]);
    const [expiringItems, setExpiringItems] = useState<PantryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    
    // View Mode
    const [viewMode, setViewMode] = useState<'all' | 'expiring'>('all');

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEdit = (item: PantryItem) => {
        setEditingItem(item);
        setIsUpdateModalOpen(true);
    };

    const handleItemUpdated = useCallback((updatedItem: PantryItem) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === updatedItem.id ? { ...item, ...updatedItem } : item
            )
        );
        setExpiringItems(prevExpiring => {
            const updatedList = prevExpiring.map(item =>
                item.id === updatedItem.id ? { ...item, ...updatedItem } : item
            );
            return updatedList.sort((a, b) => {
                const dateA = a.expirationDate ? new Date(a.expirationDate).getTime() : Infinity;
                const dateB = b.expirationDate ? new Date(b.expirationDate).getTime() : Infinity;
                return dateA - dateB;
            });
        });
        setHighlightedItemId(updatedItem.id);
        setToastMessage('Item updated successfully!');
        setTimeout(() => setHighlightedItemId(null), 2000);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [itemsRes, expiringRes] = await Promise.all([
                fetch('http://localhost:3000/items'),
                fetch('http://localhost:3000/expiring')
            ]);

            if (!itemsRes.ok || !expiringRes.ok) {
                throw new Error('Failed to fetch data');
            }

            const itemsData = await itemsRes.json();
            const expiringData = await expiringRes.json();

            setItems(itemsData);
            setExpiringItems(expiringData);
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data. Is the server running?');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen text-primary">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen text-red-500">
                <p>{error}</p>
            </div>
        );
    }

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Determine which items to show based on viewMode
    const baseItems = viewMode === 'expiring' ? expiringItems : items;

    // Filter Logic
    const finalDisplayedItems = baseItems.filter(item => {
        const matchesName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? item.category?.name === selectedCategory : true;
        return matchesName && matchesCategory;
    });

    // Extract Categories
    const categories = Array.from(new Set(items.map(i => i.category?.name).filter((n): n is string => !!n))).sort();
    
    const filteredCategoryOptions = categories
        .filter(c => c.toLowerCase().includes(categoryFilter.toLowerCase()))
        .slice(0, 10);

    return (
        <div className="min-h-screen">
            <header className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-primary glow-primary flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                </svg>
                            </div>
                            <span className="text-primary font-bold tracking-tighter text-xl">SMART PANTRY</span>
                        </div>
                        <h1 className="text-5xl font-extrabold text-white tracking-tight">
                            Inventory <span className="text-primary">Dashboard</span>
                        </h1>
                        <p className="text-gray-400 mt-2 text-lg">Manage your kitchen essentials with ease and precision.</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Combined Stats Banner (Spans 2 columns) */}
                    <div 
                        onClick={() => { setViewMode('all'); setSelectedCategory(null); setSearchTerm(''); }}
                        className={`col-span-1 md:col-span-2 glass-panel p-6 rounded-2xl relative overflow-hidden group transition-all duration-300
                            ${viewMode === 'all' && !selectedCategory && !searchTerm ? 'ring-1 ring-primary/30 bg-white/[0.03]' : 'hover:bg-white/[0.04] cursor-pointer'}
                        `}
                    >
                        {/* Ambient Background Glows */}
                        <div className="absolute -left-4 -top-4 w-40 h-40 blur-3xl opacity-10 bg-primary pointer-events-none" />
                        <div className="absolute -right-4 -bottom-4 w-40 h-40 blur-3xl opacity-10 bg-emerald-500 pointer-events-none" />
                        
                        <div className="flex flex-col sm:flex-row items-center justify-around h-full gap-8 relative z-10">
                             {/* Total Items */}
                             <div className="flex-1 flex items-center justify-center sm:justify-start gap-5 w-full sm:w-auto">
                                <div className="p-4 rounded-xl bg-primary/10 text-primary ring-1 ring-white/5 shadow-lg shadow-primary/10">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                   <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">Total Items</h3>
                                   <p className="text-4xl sm:text-5xl font-bold tracking-tight text-white">{items.length}</p>
                                </div>
                             </div>
                             
                             {/* Divider */}
                             <div className="hidden sm:block w-px h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                             <div className="block sm:hidden w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                             {/* Total Quantity */}
                             <div className="flex-1 flex items-center justify-center sm:justify-start gap-5 w-full sm:w-auto">
                                <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-white/5 shadow-lg shadow-emerald-500/10">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </svg>
                                </div>
                                <div>
                                   <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">Total Quantity</h3>
                                   <p className="text-4xl sm:text-5xl font-bold tracking-tight text-emerald-400">{totalQuantity}</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    <StatCard
                        title="Expiring Soon"
                        value={expiringItems.length}
                        type={expiringItems.length > 0 ? 'warning' : 'success'}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        onClick={() => setViewMode('expiring')}
                        isActive={viewMode === 'expiring'}
                    />
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {viewMode === 'expiring' ? 'Expiring Items' : 'Active Inventory'}
                            </h2>
                            {(viewMode === 'expiring' || selectedCategory || searchTerm) && (
                                <button 
                                    onClick={() => { setViewMode('all'); setSelectedCategory(null); setSearchTerm(''); setCategoryFilter(''); }}
                                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                        
                        {/* Search & Filter Controls */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            {/* Item Name Search */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm"
                                />
                            </div>

                            {/* Category Autocomplete */}
                            <div className="relative" ref={categoryDropdownRef}>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Filter by category..."
                                        value={selectedCategory || categoryFilter}
                                        onChange={(e) => {
                                            setCategoryFilter(e.target.value);
                                            setSelectedCategory(null); // Clear selection when typing
                                            setIsCategoryDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsCategoryDropdownOpen(true)}
                                        className={`w-full sm:w-64 pl-10 pr-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm ${selectedCategory ? 'text-primary font-semibold' : ''}`}
                                    />
                                    {selectedCategory && (
                                        <button 
                                            onClick={() => { setSelectedCategory(null); setCategoryFilter(''); }}
                                            className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-white"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                
                                {isCategoryDropdownOpen && (categoryFilter || filteredCategoryOptions.length > 0) && !selectedCategory && (
                                    <div className="absolute top-full mt-2 w-full glass-panel border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 max-h-60 overflow-y-auto">
                                        <ul role="listbox">
                                            {filteredCategoryOptions.length > 0 ? (
                                                filteredCategoryOptions.map(cat => (
                                                    <li key={cat}>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCategory(cat);
                                                                setCategoryFilter('');
                                                                setIsCategoryDropdownOpen(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                                                        >
                                                            {cat}
                                                        </button>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="px-4 py-2 text-sm text-gray-500">No categories found</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="h-px w-full bg-white/10 hidden md:block"></div>

                    <ItemTable
                        items={finalDisplayedItems}
                        onEdit={handleEdit}
                        onAdd={() => setIsModalOpen(true)}
                        onImport={() => setIsImportModalOpen(true)}
                        highlightedItemId={highlightedItemId}
                    />
                </div>
            </main>

            <AddItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onItemAdded={fetchData}
            />

            <UpdateItemModal
                isOpen={isUpdateModalOpen}
                onClose={() => {
                    setIsUpdateModalOpen(false);
                    setEditingItem(null);
                }}
                onItemUpdated={handleItemUpdated}
                item={editingItem}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onItemsImported={fetchData}
            />

            <Toast
                message={toastMessage || ''}
                isVisible={!!toastMessage}
                onClose={() => setToastMessage(null)}
                type="success"
            />
        </div>
    );
};

export default Dashboard;