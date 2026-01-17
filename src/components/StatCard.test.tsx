import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard', () => {
    const mockIcon = <svg data-testid="mock-icon" />;

    it('renders the title correctly', () => {
        render(<StatCard title="Total Items" value={42} icon={mockIcon} />);
        expect(screen.getByText('Total Items')).toBeInTheDocument();
    });

    it('renders a numeric value correctly', () => {
        render(<StatCard title="Total Items" value={42} icon={mockIcon} />);
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders a string value correctly', () => {
        render(<StatCard title="Status" value="Active" icon={mockIcon} />);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders the icon', () => {
        render(<StatCard title="Test" value={1} icon={mockIcon} />);
        expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('renders with success type', () => {
        const { container } = render(
            <StatCard title="Fresh Items" value={10} type="success" icon={mockIcon} />
        );
        // Check for success-related styling classes
        expect(container.querySelector('.text-emerald-400')).toBeInTheDocument();
    });

    it('renders with warning type', () => {
        const { container } = render(
            <StatCard title="Low Stock" value={3} type="warning" icon={mockIcon} />
        );
        expect(container.querySelector('.text-amber-400')).toBeInTheDocument();
    });

    it('renders with danger type', () => {
        const { container } = render(
            <StatCard title="Expired" value={5} type="danger" icon={mockIcon} />
        );
        expect(container.querySelector('.text-red-400')).toBeInTheDocument();
    });

    it('renders with neutral type by default', () => {
        const { container } = render(
            <StatCard title="Default" value={0} icon={mockIcon} />
        );
        expect(container.querySelector('.text-white')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<StatCard title="Clickable" value={1} icon={mockIcon} onClick={handleClick} />);
        
        fireEvent.click(screen.getByText('Clickable').closest('.glass-panel')!);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows pointer cursor when clickable', () => {
        const { container } = render(
            <StatCard title="Clickable" value={1} icon={mockIcon} onClick={() => {}} />
        );
        expect(container.firstChild).toHaveClass('cursor-pointer');
    });

    it('applies active styling', () => {
        const { container } = render(
            <StatCard title="Active" value={1} icon={mockIcon} isActive={true} />
        );
        expect(container.firstChild).toHaveClass('ring-primary');
    });
});