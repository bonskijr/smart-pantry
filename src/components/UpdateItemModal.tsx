import React, { useState, useEffect } from 'react';
import type { PantryItem } from '../types/PantryItem';
import { useCategories } from '../hooks/useCategories';
import { ENDPOINTS } from '../config';

interface Category {
    id: number;
    name: string;
}

interface UpdateItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onItemUpdated: (updatedItem: PantryItem & { category?: { id: number; name: string } }) => void;
    item: PantryItem | null;
}

const UpdateItemModal: React.FC<UpdateItemModalProps> = ({ isOpen, onClose, onItemUpdated, item }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [expirationDate, setExpirationDate] = useState('');

    const { categories, fetchCategories, createCategory } = useCategories();

    // New Category State
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Internal state for custom confirmation dialog
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    useEffect(() => {
        if (isOpen && item) {
            setName(item.name);
            setQuantity(item.quantity);
            setCategoryId(item.categoryId);
            setExpirationDate(item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : '');
            setIsNewCategory(false);
            setNewCategoryName('');
            setShowConfirmClose(false);
            fetchCategories();
        }
    }, [isOpen, item, fetchCategories]);

    // Track if form has unsaved changes (compare against original item values)
    const isDirty = item ? (
        name !== item.name ||
        quantity !== item.quantity ||
        categoryId !== item.categoryId ||
        expirationDate !== (item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : '') ||
        newCategoryName !== ''
    ) : false;

    // Handle ESC key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                e.stopPropagation();

                if (showConfirmClose) {
                     // If confirm dialog is open, ESC cancels closing (keeps editing)
                    setShowConfirmClose(false);
                    return;
                }

                if (isDirty) {
                    setShowConfirmClose(true);
                } else {
                    onClose();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isDirty, onClose, showConfirmClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;

        setLoading(true);
        setError(null);

        try {
            let finalCategoryId = categoryId;

            if (isNewCategory) {
                if (!newCategoryName.trim()) {
                    throw new Error('Category name is required');
                }
                finalCategoryId = await createCategory(newCategoryName);
            } else if (!categoryId) {
                throw new Error('Please select a category');
            }

            const response = await fetch(`${ENDPOINTS.ITEMS}/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    quantity,
                    categoryId: finalCategoryId,
                    expirationDate: expirationDate || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errMsg = errorData.error || 'Failed to update item';
                if (typeof errMsg === 'object') {
                    errMsg = JSON.stringify(errMsg);
                }
                throw new Error(errMsg);
            }

            const updatedItem = await response.json();

            let category = categories.find(c => c.id === finalCategoryId);
            if (!category && isNewCategory) {
                category = { id: finalCategoryId as number, name: newCategoryName };
            }

            onItemUpdated({ ...updatedItem, category });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 relative">
                 {/* Custom Confirmation Overlay */}
                 {showConfirmClose && (
                    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
                         <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Unsaved Changes</h3>
                        <p className="text-gray-500 mb-6">You have modified this item. Are you sure you want to close?</p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setShowConfirmClose(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all"
                            >
                                Keep Editing
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold transition-all border border-red-200"
                            >
                                Discard & Close
                            </button>
                        </div>
                    </div>
                )}

                <div className="px-8 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Edit Item</h2>
                            <p className="text-gray-500 text-sm mt-1">Update the details of your pantry item.</p>
                        </div>
                        <button
                            onClick={() => isDirty ? setShowConfirmClose(true) : onClose()}
                            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-500 text-[0.65rem] font-bold uppercase tracking-widest mb-1.5 ml-1">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 hover:border-primary/50 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-500 text-[0.65rem] font-bold uppercase tracking-widest mb-1.5 ml-1">Quantity</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                        min={1}
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 hover:border-primary/50 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1.5 ml-1">
                                        <label className="block text-gray-500 text-[0.65rem] font-bold uppercase tracking-widest">Category</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsNewCategory(!isNewCategory);
                                                setNewCategoryName('');
                                                setCategoryId('');
                                            }}
                                            className="text-[0.65rem] text-primary hover:text-primary-hover transition-colors uppercase font-bold tracking-wider"
                                        >
                                            {isNewCategory ? 'Select Existing' : 'Create New'}
                                        </button>
                                    </div>

                                    {isNewCategory ? (
                                        <input
                                            type="text"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            required={isNewCategory}
                                            placeholder="New Category Name"
                                            className="w-full bg-gray-50 border border-gray-200 hover:border-primary/50 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
                                        />
                                    ) : (
                                        <select
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(Number(e.target.value) || '')}
                                            required={!isNewCategory}
                                            className="w-full bg-gray-50 border border-gray-200 hover:border-primary/50 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="" className="bg-white">Select</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id} className="bg-white">
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-500 text-[0.65rem] font-bold uppercase tracking-widest mb-1.5 ml-1">Expiration Date (optional)</label>
                                <input
                                    type="date"
                                    value={expirationDate}
                                    onChange={(e) => setExpirationDate(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 hover:border-primary/50 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => isDirty ? setShowConfirmClose(true) : onClose()}
                                className="flex-1 px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all glow-primary disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update Item'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdateItemModal;