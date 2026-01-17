import React, { useState } from 'react';
import type { PantryItem } from '../types/PantryItem';

interface ItemTableProps {
    items: PantryItem[];
    onEdit: (item: PantryItem) => void;
    onAdd: () => void;
    onImport: () => void;
    highlightedItemId?: string | null;
}

const ItemTable: React.FC<ItemTableProps> = ({ items, onEdit, onAdd, onImport, highlightedItemId }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    if (items.length === 0) {
        return <div className="text-gray-400 text-center py-8">No items found in pantry.</div>;
    }

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const getPageNumbers = () => {
        const delta = 1; // Number of pages shown around the current page
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    };

    return (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/5">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-6 py-5 text-gray-400 uppercase text-[0.65rem] font-bold tracking-[0.2em]">Product Name</th>
                            <th className="px-6 py-5 text-gray-400 uppercase text-[0.65rem] font-bold tracking-[0.2em]">Quantity</th>
                            <th className="px-6 py-5 text-gray-400 uppercase text-[0.65rem] font-bold tracking-[0.2em]">Category</th>
                            <th className="px-6 py-5 text-gray-400 uppercase text-[0.65rem] font-bold tracking-[0.2em]">Expiry Date</th>
                            <th className="px-6 py-5 text-right">
                                <div className="flex justify-end items-center gap-3">
                                    <div className="tooltip-container">
                                        <button
                                            onClick={onImport}
                                            className="text-primary hover:text-white transition-all p-2 rounded-xl hover:bg-primary/20 ring-1 ring-white/5 hover:ring-primary/50"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <span className="tooltip-text tooltip-bottom">Import CSV</span>
                                    </div>
                                    <div className="tooltip-container">
                                        <button
                                            onClick={onAdd}
                                            className="text-success hover:text-white transition-all p-2 rounded-xl hover:bg-success/20 ring-1 ring-white/5 hover:ring-success/50"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011-1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <span className="tooltip-text tooltip-bottom">Add Item</span>
                                    </div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {currentItems.map((item) => {
                            const isHighlighted = highlightedItemId === item.id;
                            const isLowStock = item.quantity < 5;
                            return (
                                <tr
                                    key={item.id}
                                    className={`group transition-all duration-300 ${isHighlighted
                                        ? 'bg-primary/20'
                                        : 'hover:bg-white/[0.04]'
                                        }`}
                                >
                                    <td className="px-6 py-5">
                                        <div className="font-semibold text-white tracking-tight">{item.name}</div>
                                        {isLowStock && <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Low Stock</span>}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-lg font-bold ${isLowStock ? 'text-amber-400' : 'text-gray-300'}`}>{item.quantity}</span>
                                            <span className="text-gray-500 text-sm font-medium">units</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="bg-white/5 text-gray-300 py-1.5 px-4 rounded-lg text-xs font-semibold ring-1 ring-white/10 group-hover:ring-primary/40 transition-all border border-transparent group-hover:border-primary/20">
                                            {/* @ts-ignore */}
                                            {(item as any).category?.name || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-gray-400 font-medium text-sm">
                                            {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="tooltip-container">
                                            <button
                                                onClick={() => onEdit(item)}
                                                className="text-gray-500 hover:text-primary transition-all p-2 rounded-xl group-hover:bg-primary/10 opacity-0 group-hover:opacity-100 ring-1 ring-transparent hover:ring-primary/30"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            <span className="tooltip-text text-transform-none">Edit Item</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="px-6 py-6 flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
                    <div className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.1em]">
                        Showing <span className="text-white">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, items.length)}</span> of <span className="text-white">{items.length}</span> items
                    </div>
                    <div className="flex gap-1 items-center">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {getPageNumbers().map((pageNum, i) => (
                            pageNum === '...' ? (
                                <span key={`sep-${i}`} className="px-2 text-gray-600 font-bold">...</span>
                            ) : (
                                <button
                                    key={pageNum}
                                    onClick={() => paginate(pageNum as number)}
                                    className={`w-9 h-9 rounded-xl text-[0.7rem] font-bold transition-all border ${currentPage === pageNum ? 'bg-primary text-white border-primary glow-primary shadow-lg shadow-primary/20' : 'text-gray-500 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {pageNum}
                                </button>
                            )
                        ))}

                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemTable;
