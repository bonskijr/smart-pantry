import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Toast from './Toast';

describe('Toast', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders message correctly', () => {
        render(
            <Toast message="Item added successfully" isVisible={true} onClose={() => { }} />
        );
        expect(screen.getByText('Item added successfully')).toBeInTheDocument();
    });

    it('does not render when isVisible is false', () => {
        render(
            <Toast message="Hidden message" isVisible={false} onClose={() => { }} />
        );
        expect(screen.queryByText('Hidden message')).not.toBeInTheDocument();
    });

    it('renders with success type styling by default', () => {
        const { container } = render(
            <Toast message="Success" isVisible={true} onClose={() => { }} />
        );
        expect(container.querySelector('.text-emerald-400')).toBeInTheDocument();
    });

    it('renders with error type styling', () => {
        const { container } = render(
            <Toast message="Error occurred" isVisible={true} onClose={() => { }} type="error" />
        );
        expect(container.querySelector('.text-red-400')).toBeInTheDocument();
    });

    it('renders with info type styling', () => {
        const { container } = render(
            <Toast message="Info message" isVisible={true} onClose={() => { }} type="info" />
        );
        expect(container.querySelector('.text-primary')).toBeInTheDocument();
    });

    it('calls onClose after timeout', async () => {
        const onClose = vi.fn();
        render(
            <Toast message="Auto close" isVisible={true} onClose={onClose} />
        );

        // Fast-forward past the 3000ms display time + 300ms fade animation
        await vi.advanceTimersByTimeAsync(3300);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders success icon for success type', () => {
        render(
            <Toast message="Success" isVisible={true} onClose={() => { }} type="success" />
        );
        // Check for SVG element (the checkmark icon)
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('renders error icon for error type', () => {
        render(
            <Toast message="Error" isVisible={true} onClose={() => { }} type="error" />
        );
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('renders info icon for info type', () => {
        render(
            <Toast message="Info" isVisible={true} onClose={() => { }} type="info" />
        );
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });
});
