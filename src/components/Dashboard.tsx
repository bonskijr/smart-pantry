import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import ItemTable from './ItemTable';
import StatCard from './StatCard';
import AddItemModal from './AddItemModal';
import UpdateItemModal from './UpdateItemModal';
import ImportModal from './ImportModal';
import Toast from './Toast';
import type { PantryItem } from '../types/PantryItem';
import { ENDPOINTS } from '../config';

const Dashboard: React.FC = () => {
    const [items, setItems] = useState<PantryItem[]>([]);
    const [expiringItems, setExpiringItems] = useState<PantryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
    const [highlightedItemId, setHighlightedItemId] = useState<number | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    
    // View Mode
    const [viewMode, setViewMode] = useState<'all' | 'expiring'>('all');

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<{id: number, name: string}[]>([]);
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
            // Build query params for items if categories are selected
            let itemsUrl = ENDPOINTS.ITEMS;
            if (selectedCategories.length > 0) {
                const catIds = selectedCategories.map(c => c.id).join(',');
                itemsUrl += `?categories=${catIds}`;
            }

            const [itemsRes, expiringRes] = await Promise.all([
                fetch(itemsUrl), // Use local dynamic URL
                fetch(ENDPOINTS.EXPIRING)
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
    }, [selectedCategories]); // Add selectedCategories to dependencies to refetch on change

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Determine which items to show based on viewMode
    const baseItems = viewMode === 'expiring' ? expiringItems : items;

    // Filter Logic (Memoized)
    const finalDisplayedItems = useMemo(() => {
        return baseItems.filter(item => {
            const matchesName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            // No need to client-side filter categories for the main list since the API does it,
            // but we might need it for "expiring" or if we want to be safe. 
            // Since we fetch specific categories, we can trust the API, OR filter again.
            // Let's rely on the API for the main list, but for 'expiring' we fetched ALL expiring.
            // So we SHOULD client-side filter 'expiring' view if we want consistency, 
            // OR fetch expiring with filters too. 
            
            // Current approach: Main list is server-filtered. Expiring list is ALL expiring.
            // If user selects category, they probably expect expiring view to also filter.
            
            let matchesCategory = true;
            if (selectedCategories.length > 0) {
                 matchesCategory = selectedCategories.some(c => c.id === item.category?.id);
            }
            
            return matchesName && matchesCategory;
        });
    }, [baseItems, searchTerm, selectedCategories]);

    // Extract Categories (Memoized)
    // We need to fetch ALL items to get ALL categories for the dropdown, 
    // or separate category fetch. Currently we extract from loaded items.
    // If we filter items by category 1, we only see category 1 in the list.
    // So we can't extract all categories from the *filtered* items list if we want to show others.
    // ISSUE: Dropdown options disappear when filter is active if we derive from `items`.
    // SOLUTION: We should probably fetch categories separately or use a separate "all items" fetch for metadata.
    // For now, to keep it simple and consistent with previous code, we will derive from the *initial* load or 
    // we accept that options narrow down.
    // BETTER: Let's assume for now we might lose options if we strictly rely on `items`.
    // However, `useCategories` hook logic existed elsewhere.
    // Let's implement a separate category fetch to ensure the dropdown always has options.
    
    const [allCategories, setAllCategories] = useState<{id: number, name: string}[]>([]);

    useEffect(() => {
        // Fetch all categories once for the dropdown
        fetch(ENDPOINTS.ITEMS) // This fetches ALL by default (no params)
            .then(res => res.json())
            .then(data => {
                const unique = new Map<number, {id: number, name: string}>();
                data.forEach((i: any) => {
                    if (i.category) unique.set(i.category.id, i.category);
                });
                setAllCategories(Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name)));
            })
            .catch(console.error);
    }, []); // Run once on mount

    
    const filteredCategoryOptions = useMemo(() => {
        return allCategories
            .filter(c => c.name.toLowerCase().includes(categoryFilter.toLowerCase()))
            .filter(c => !selectedCategories.some(sc => sc.id === c.id))
            .slice(0, 10);
    }, [allCategories, categoryFilter, selectedCategories]);

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
                        onClick={() => { setViewMode('all'); setSelectedCategories([]); setSearchTerm(''); }}
                        className={`col-span-1 md:col-span-2 glass-panel p-6 rounded-2xl relative overflow-hidden group transition-all duration-300
                            ${viewMode === 'all' && selectedCategories.length === 0 && !searchTerm ? 'ring-1 ring-primary/30 bg-white/[0.03]' : 'hover:bg-white/[0.04] cursor-pointer'}
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
                            {(viewMode === 'expiring' || selectedCategories.length > 0 || searchTerm) && (
                                <button 
                                    onClick={() => { setViewMode('all'); setSelectedCategories([]); setSearchTerm(''); setCategoryFilter(''); }}
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
                                        placeholder={selectedCategories.length >= 3 ? "Max 3 categories selected" : "Filter by category..."}
                                        value={categoryFilter}
                                        disabled={selectedCategories.length >= 3}
                                        onChange={(e) => {
                                            setCategoryFilter(e.target.value);
                                            setIsCategoryDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsCategoryDropdownOpen(true)}
                                        className={`w-full sm:w-64 pl-10 pr-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                                    />
                                </div>
                                
                                {isCategoryDropdownOpen && (categoryFilter || filteredCategoryOptions.length > 0) && selectedCategories.length < 3 && (
                                    <div className="absolute top-full mt-2 w-full glass-panel border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 max-h-60 overflow-y-auto">
                                        <ul role="listbox">
                                            {filteredCategoryOptions.length > 0 ? (
                                                filteredCategoryOptions.map(cat => (
                                                    <li key={cat.id}>
                                                        <button
                                                            onClick={() => {
                                                                if (selectedCategories.length < 3) {
                                                                    setSelectedCategories([...selectedCategories, cat]);
                                                                    setCategoryFilter('');
                                                                    setIsCategoryDropdownOpen(false);
                                                                }
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                                                        >
                                                            {cat.name}
                                                        </button>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="px-4 py-2 text-sm text-gray-500">No categories found</li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {/* Selected Categories Chips */}
                                {selectedCategories.length > 0 && (
                                    <div className="absolute top-full left-0 mt-2 flex flex-wrap gap-2 max-w-sm">
                                        {selectedCategories.map(cat => (
                                            <span key={cat.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30 z-10">
                                                {cat.name}
                                                <button
                                                    onClick={() => setSelectedCategories(selectedCategories.filter(c => c.id !== cat.id))}
                                                    className="ml-1.5 h-3.5 w-3.5 rounded-full inline-flex items-center justify-center hover:bg-primary/30 focus:outline-none"
                                                >
                                                    <span className="sr-only">Remove {cat.name}</span>
                                                    <svg className="h-2.5 w-2.5" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                                        <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                                    </svg>
                                                </button>
                                            </span>
                                        ))}
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