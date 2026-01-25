import React, { useState } from 'react';
import type { PantryItem } from '../types/PantryItem';

interface ItemTableProps {
    items: PantryItem[];
    onEdit: (item: PantryItem) => void;
    onAdd: () => void;
    onImport: () => void;
    highlightedItemId?: number | null;
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
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-700 bg-gray-800">
                            <th className="px-4 lg:px-6 py-4 text-gray-200 uppercase text-xs font-semibold tracking-wider">Product Name</th>
                            <th className="px-4 lg:px-6 py-4 text-gray-200 uppercase text-xs font-semibold tracking-wider">Qty</th>
                            <th className="px-4 lg:px-6 py-4 text-gray-200 uppercase text-xs font-semibold tracking-wider">Category</th>
                            <th className="px-4 lg:px-6 py-4 text-gray-200 uppercase text-xs font-semibold tracking-wider">Expiry</th>
                            <th className="px-4 lg:px-6 py-4 text-right">
                                <div className="flex justify-end items-center gap-2">
                                    <div className="tooltip-container">
                                        <button
                                            onClick={onImport}
                                            aria-label="Import CSV"
                                            className="text-primary hover:text-primary-hover transition-all p-1.5 rounded-lg hover:bg-primary/10 border border-gray-200 hover:border-primary/50"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <span className="tooltip-text tooltip-bottom">Import CSV</span>
                                    </div>
                                    <div className="tooltip-container">
                                        <button
                                            onClick={onAdd}
                                            aria-label="Add Item"
                                            className="text-teal-600 hover:text-teal-700 transition-all p-1.5 rounded-lg hover:bg-teal-50 border border-gray-200 hover:border-teal-300"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011-1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <span className="tooltip-text tooltip-bottom">Add Item</span>
                                    </div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentItems.map((item) => {
                            const isHighlighted = highlightedItemId === item.id;
                            const isLowStock = item.quantity < 5;
                            return (
                                <tr
                                    key={item.id}
                                    className={`group transition-all duration-300 ${isHighlighted
                                        ? 'bg-primary/10'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                                        <div className="font-semibold text-gray-800 tracking-tight text-sm">{item.name}</div>
                                        {isLowStock && <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Low Stock</span>}
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-base font-bold ${isLowStock ? 'text-amber-600' : 'text-gray-700'}`}>{item.quantity}</span>
                                            <span className="text-gray-400 text-xs font-medium">units</span>
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                                        <span className="bg-gray-100 text-gray-600 py-1 px-2.5 rounded-md text-[10px] lg:text-xs font-semibold border border-gray-200 truncate max-w-[100px] inline-block">
                                            {item.category?.name || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                                        <div className="text-gray-600 font-medium text-xs lg:text-sm">
                                            {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                                        <div className="tooltip-container">
                                            <button
                                                onClick={() => onEdit(item)}
                                                aria-label="Edit Item"
                                                className="text-gray-400 hover:text-primary transition-all p-1.5 rounded-lg group-hover:bg-primary/10 opacity-0 group-hover:opacity-100"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
                <div className="px-4 lg:px-6 py-4 lg:py-5 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                    <div className="text-xs text-gray-500 font-semibold">
                        Showing <span className="text-gray-800">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, items.length)}</span> of <span className="text-gray-800">{items.length}</span> items
                    </div>
                    <div className="flex gap-1 items-center">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                            className={`p-1.5 lg:p-2 rounded-lg transition-all ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {getPageNumbers().map((pageNum, i) => (
                            pageNum === '...' ? (
                                <span key={`sep-${i}`} className="px-2 text-gray-600 font-bold text-xs">...</span>
                            ) : (
                                <button
                                    key={pageNum}
                                    onClick={() => paginate(pageNum as number)}
                                    aria-label={`Page ${pageNum}`}
                                    className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl text-xs lg:text-sm font-semibold transition-all border ${currentPage === pageNum ? 'bg-primary text-white border-primary shadow-md' : 'text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-800'}`}
                                >
                                    {pageNum}
                                </button>
                            )
                        ))}

                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                            className={`p-1.5 lg:p-2 rounded-lg transition-all ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
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