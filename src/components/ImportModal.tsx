import React, { useState } from 'react';

interface ImportResult {
    success: number;
    failed: number;
    errors: { item: any; reason: string }[];
}

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onItemsImported: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onItemsImported }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const parseCSV = (text: string) => {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const items = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());
            const item: any = {};

            headers.forEach((header, index) => {
                if (header === 'name') item.name = values[index];
                if (header === 'quantity') item.quantity = values[index];
                if (header === 'category') item.categoryName = values[index];
                if (header === 'expirationdate') item.expirationDate = values[index];
            });

            items.push(item);
        }
        return items;
    };

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const text = await file.text();
            const items = parseCSV(text);

            if (items.length === 0) {
                throw new Error('No items found in CSV');
            }

            const response = await fetch('http://localhost:3000/items/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });

            if (!response.ok) {
                throw new Error('Failed to import items');
            }

            const data = await response.json();
            setResult(data);
            onItemsImported();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during import');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="glass-panel rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden ring-1 ring-white/10 flex flex-col max-h-[90vh]">
                <div className="px-8 py-8 flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-8 shrink-0">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Bulk Import</h2>
                            <p className="text-gray-400 text-sm mt-1">Upload a CSV file to add multiple items at once.</p>
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

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Template Section */}
                        <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 mb-8">
                            <h3 className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest mb-4">CSV Requirements</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-2">Required Columns:</p>
                                    <code className="block bg-black/30 p-3 rounded-xl text-primary text-xs font-mono ring-1 ring-white/5">
                                        Name,Quantity,Category,ExpirationDate
                                    </code>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-2">Data Example:</p>
                                    <code className="block bg-black/30 p-3 rounded-xl text-gray-400 text-xs font-mono italic ring-1 ring-white/5">
                                        Milk,2,Dairy,2026-12-31<br />
                                        Pasta,5,Grains
                                    </code>
                                </div>
                            </div>
                        </div>

                        {!result && (
                            <div className="space-y-8 pb-4">
                                <div className="group relative">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="csv-upload"
                                    />
                                    <label
                                        htmlFor="csv-upload"
                                        className="cursor-pointer border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-primary/[0.02] transition-all group"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ring-1 ring-white/10 group-hover:ring-primary/30">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <span className="text-white font-semibold text-lg tracking-tight">
                                            {file ? file.name : 'Select CSV File'}
                                        </span>
                                        <span className="text-sm text-gray-500 mt-2">Maximum file size: 5MB</span>
                                    </label>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all ring-1 ring-white/10 hover:ring-white/20"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={!file || loading}
                                        className="flex-1 px-8 py-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all glow-primary disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Start Import'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {result && (
                            <div className="space-y-8 pb-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl text-center">
                                        <div className="text-4xl font-extrabold text-emerald-400 tracking-tight">{result.success}</div>
                                        <div className="text-[0.65rem] font-bold text-emerald-500/70 uppercase tracking-widest mt-1">Succeeded</div>
                                    </div>
                                    <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl text-center">
                                        <div className="text-4xl font-extrabold text-red-400 tracking-tight">{result.failed}</div>
                                        <div className="text-[0.65rem] font-bold text-red-500/70 uppercase tracking-widest mt-1">Failed</div>
                                    </div>
                                </div>

                                {result.errors.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest ml-1">Failure Details</h3>
                                        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 ring-1 ring-white/5">
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                <table className="min-w-full text-xs text-left border-collapse">
                                                    <thead className="bg-white/[0.03] text-gray-500 uppercase font-bold tracking-wider sticky top-0 backdrop-blur-md">
                                                        <tr>
                                                            <th className="px-6 py-4">Item Name</th>
                                                            <th className="px-6 py-4">Error Reason</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {result.errors.map((err, idx) => (
                                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                                                <td className="px-6 py-4 text-white font-medium">{err.item.name || 'Unknown'}</td>
                                                                <td className="px-6 py-4 text-red-400/80">{err.reason}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={onClose}
                                    className="w-full px-8 py-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold transition-all glow-primary"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
