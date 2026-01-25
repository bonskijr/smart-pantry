import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Recharts to avoid "width/height must be > 0" errors in test environment
vi.mock('recharts', async () => {
    const OriginalModule = await vi.importActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
            <div style={{ width: '800px', height: '800px' }}>{children}</div>
        ),
        PieChart: ({ children }: { children: React.ReactNode }) => (
            <svg>{children}</svg>
        ),
    };
});