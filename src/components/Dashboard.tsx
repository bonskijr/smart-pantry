import React, { useEffect, useState, useCallback } from 'react';
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

    const handleEdit = (item: PantryItem) => {
        setEditingItem(item);
        setIsUpdateModalOpen(true);
    };

    const handleItemUpdated = useCallback((updatedItem: PantryItem) => {
        // Update items in place without refetching
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === updatedItem.id ? { ...item, ...updatedItem } : item
            )
        );
        // Also update expiring items if the updated item is in that list
        setExpiringItems(prevExpiring =>
            prevExpiring.map(item =>
                item.id === updatedItem.id ? { ...item, ...updatedItem } : item
            )
        );
        setHighlightedItemId(updatedItem.id);
        setToastMessage('Item updated successfully!');
        // Clear highlight after 2 seconds
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
                    <StatCard
                        title="Total Items"
                        value={items.length}
                        type="neutral"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Total Quantity"
                        value={totalQuantity}
                        type="success"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Expiring Soon"
                        value={expiringItems.length}
                        type={expiringItems.length > 0 ? 'warning' : 'success'}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Active Inventory</h2>
                        <div className="h-px flex-1 bg-white/10 mx-6 hidden md:block"></div>
                    </div>

                    <ItemTable
                        items={items}
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
