import React, { useState, useEffect } from 'react';
import { useCategories } from '../hooks/useCategories';

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onItemAdded: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onItemAdded }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [categoryId, setCategoryId] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    
    const { categories, fetchCategories, createCategory } = useCategories();
    
    // New Category State
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const resetForm = () => {
        setName('');
        setQuantity(1);
        setCategoryId('');
        setExpirationDate('');
        setIsNewCategory(false);
        setNewCategoryName('');
    };

    useEffect(() => {
        if (isOpen) {
            setSuccessMessage(null);
            setError(null);
            resetForm();
            fetchCategories();
        }
    }, [isOpen, fetchCategories]);

    const handleSubmit = async (e: React.SyntheticEvent, shouldClose: boolean = true) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            let finalCategoryId = categoryId;

            if (isNewCategory) {
                if (!newCategoryName.trim()) {
                    throw new Error('Category name is required');
                }
                finalCategoryId = await createCategory(newCategoryName);
            } else if (!categoryId) {
                 // Should be caught by required attribute but good to have
                 throw new Error('Please select a category');
            }

            const response = await fetch('http://localhost:3000/items', {
                method: 'POST',
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
                let errMsg = errorData.error || 'Failed to create item';
                if (typeof errMsg === 'object') {
                    errMsg = JSON.stringify(errMsg);
                }
                throw new Error(errMsg);
            }

            onItemAdded();
            
            if (isNewCategory) {
                setIsNewCategory(false);
                setNewCategoryName('');
            }

            if (shouldClose) {
                resetForm();
                onClose();
            } else {
                // Keep open, show success, and reset form
                setName('');
                setQuantity(1);
                setExpirationDate('');
                
                setSuccessMessage(`${name} added successfully!`);
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="glass-panel rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/10">
                <div className="px-8 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Add New Item</h2>
                            <p className="text-gray-400 text-sm mt-1">Fill in the details to track your pantry.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all ring-1 ring-transparent hover:ring-white/10"
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

                    {successMessage && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-500 text-[0.65rem] font-bold uppercase tracking-widest mb-1.5 ml-1">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full bg-white/[0.03] border border-white/5 hover:border-primary/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-600"
                                    placeholder="Enter item name"
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
                                        className="w-full bg-white/[0.03] border border-white/5 hover:border-primary/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                                            className="text-[0.65rem] text-primary hover:text-white transition-colors uppercase font-bold tracking-wider"
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
                                            className="w-full bg-white/[0.03] border border-white/5 hover:border-primary/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-600"
                                        />
                                    ) : (
                                        <select
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                            required={!isNewCategory}
                                            className="w-full bg-white/[0.03] border border-white/5 hover:border-primary/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="" className="bg-surface">Select</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id} className="bg-surface">
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
                                    className="w-full bg-white/[0.03] border border-white/5 hover:border-primary/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all ring-1 ring-white/10 hover:ring-white/20"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all glow-primary disabled:opacity-50"
                                >
                                    {loading ? 'Adding...' : 'Add Item'}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, false)}
                                disabled={loading || !name || (!categoryId && !newCategoryName)}
                                className="w-full py-3 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add & Add Another
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddItemModal;
