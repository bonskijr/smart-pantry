import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import ItemTable from './ItemTable';
import StatCard from './StatCard';
import AddItemModal from './AddItemModal';
import UpdateItemModal from './UpdateItemModal';
import ImportModal from './ImportModal';
import CategoryPieChart from './CategoryPieChart';
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
    const [selectedCategories, setSelectedCategories] = useState<{ id: number, name: string }[]>([]);
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
            
            let matchesCategory = true;
            if (selectedCategories.length > 0) {
                matchesCategory = selectedCategories.some(c => c.id === item.category?.id);
            }

            return matchesName && matchesCategory;
        });
    }, [baseItems, searchTerm, selectedCategories]);

    const [allCategories, setAllCategories] = useState<{ id: number, name: string }[]>([]);

    useEffect(() => {
        // Fetch all categories once for the dropdown
        fetch(ENDPOINTS.ITEMS) // This fetches ALL by default (no params)
            .then(res => res.json())
            .then(data => {
                const unique = new Map<number, { id: number, name: string }>();
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
            <div className="flex justify-center items-center min-h-screen">
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

    return (
        <div className="min-h-screen bg-gray-50/50">
            <header className="px-4 sm:px-6 lg:px-8 py-8 max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-primary glow-primary flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                </svg>
                            </div>
                            <span className="text-primary font-bold tracking-tighter text-xl">SMART PANTRY</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                            Inventory <span className="text-primary">Dashboard</span>
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (Table & Filters) - Takes up more space */}
                    <div className="lg:col-span-9 space-y-6">
                         {/* Search & Filter Controls */}
                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                             <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                                    {viewMode === 'expiring' ? 'Expiring Items' : 'Active Inventory'}
                                </h2>
                                {(viewMode === 'expiring' || selectedCategories.length > 0 || searchTerm) && (
                                    <button
                                        onClick={() => { setViewMode('all'); setSelectedCategories([]); setSearchTerm(''); setCategoryFilter(''); }}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
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
                                        className="w-full sm:w-48 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                    />
                                </div>

                                {/* Category Filter Input with Tags Inside */}
                                <div className="relative" ref={categoryDropdownRef}>
                                    <div
                                        className="flex flex-wrap items-center gap-1.5 min-w-[200px] sm:min-w-[280px] pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all"
                                        onClick={() => setIsCategoryDropdownOpen(true)}
                                    >
                                        {/* Filter Icon */}
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                            </svg>
                                        </div>

                                        {/* Selected Category Chips */}
                                        {selectedCategories.map(cat => (
                                            <span key={cat.id} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                                {cat.name}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCategories(selectedCategories.filter(c => c.id !== cat.id));
                                                    }}
                                                    className="ml-1 h-3.5 w-3.5 rounded-full inline-flex items-center justify-center hover:bg-primary/20 focus:outline-none transition-colors"
                                                >
                                                    <span className="sr-only">Remove {cat.name}</span>
                                                    <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                                        <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                                    </svg>
                                                </button>
                                            </span>
                                        ))}

                                        {/* Input Field */}
                                        {selectedCategories.length < 3 && (
                                            <input
                                                type="text"
                                                placeholder={selectedCategories.length === 0 ? "Filter by category..." : ""}
                                                value={categoryFilter}
                                                onChange={(e) => {
                                                    setCategoryFilter(e.target.value);
                                                    setIsCategoryDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsCategoryDropdownOpen(true)}
                                                className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400"
                                            />
                                        )}

                                        {/* Count indicator */}
                                        {selectedCategories.length > 0 && selectedCategories.length < 3 && (
                                            <span className="text-[0.65rem] text-gray-400 ml-auto">
                                                {selectedCategories.length}/3
                                            </span>
                                        )}
                                        {selectedCategories.length >= 3 && (
                                            <span className="text-[0.65rem] text-gray-400 ml-auto">Max</span>
                                        )}
                                    </div>

                                    {isCategoryDropdownOpen && filteredCategoryOptions.length > 0 && selectedCategories.length < 3 && (
                                        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl z-50 max-h-60 overflow-y-auto">
                                            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                                                <span className="text-[0.65rem] text-gray-500 font-semibold uppercase tracking-wider">
                                                    Select categories ({selectedCategories.length}/3)
                                                </span>
                                            </div>
                                            <ul role="listbox">
                                                {filteredCategoryOptions.map(cat => (
                                                    <li key={cat.id}>
                                                        <button
                                                            onClick={() => {
                                                                if (selectedCategories.length < 3) {
                                                                    setSelectedCategories([...selectedCategories, cat]);
                                                                    setCategoryFilter('');
                                                                }
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                                                        >
                                                            {cat.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {isCategoryDropdownOpen && filteredCategoryOptions.length === 0 && categoryFilter && (
                                        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl z-50">
                                            <div className="px-4 py-3 text-sm text-gray-500">No categories found</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <ItemTable
                            items={finalDisplayedItems}
                            onEdit={handleEdit}
                            onAdd={() => setIsModalOpen(true)}
                            onImport={() => setIsImportModalOpen(true)}
                            highlightedItemId={highlightedItemId}
                        />
                    </div>

                    {/* Right Column (Graph & Expiring) */}
                    <div className="lg:col-span-3 space-y-6 flex flex-col">
                        <CategoryPieChart items={items} />
                        
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