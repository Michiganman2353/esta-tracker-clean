/**
 * Tests for Responsive Card Components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResponsiveCard, ResponsiveGrid, ResponsiveStatCard } from './ResponsiveCard';

describe('ResponsiveCard', () => {
  it('should render with title', () => {
    render(<ResponsiveCard title="Test Card" />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('should render with description', () => {
    render(
      <ResponsiveCard 
        title="Test Card" 
        description="Test description" 
      />
    );
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should render children', () => {
    render(
      <ResponsiveCard title="Test Card">
        <div>Child content</div>
      </ResponsiveCard>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should call onAction when action button is clicked', () => {
    const onAction = vi.fn();
    render(
      <ResponsiveCard 
        title="Test Card" 
        onAction={onAction}
        actionLabel="Click Me"
      />
    );
    
    const button = screen.getByRole('button', { name: 'Click Me' });
    fireEvent.click(button);
    
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ResponsiveCard 
        title="Test Card" 
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should render with compact variant', () => {
    const { container } = render(
      <ResponsiveCard 
        title="Test Card" 
        variant="compact"
      />
    );
    
    const card = container.querySelector('.bg-gray-50');
    expect(card).toBeInTheDocument();
  });

  it('should render with detailed variant and footer', () => {
    render(
      <ResponsiveCard 
        title="Test Card" 
        variant="detailed"
      />
    );
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('should use default action label when not provided', () => {
    const onAction = vi.fn();
    render(
      <ResponsiveCard 
        title="Test Card" 
        onAction={onAction}
      />
    );
    
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});

describe('ResponsiveGrid', () => {
  it('should render children', () => {
    render(
      <ResponsiveGrid>
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveGrid>
    );
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ResponsiveGrid className="custom-grid">
        <div>Item</div>
      </ResponsiveGrid>
    );
    
    expect(container.firstChild).toHaveClass('custom-grid');
  });

  it('should apply custom minColumnWidth style', () => {
    const { container } = render(
      <ResponsiveGrid minColumnWidth="300px">
        <div>Item</div>
      </ResponsiveGrid>
    );
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveStyle({
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))'
    });
  });

  it('should use default minColumnWidth when not provided', () => {
    const { container } = render(
      <ResponsiveGrid>
        <div>Item</div>
      </ResponsiveGrid>
    );
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveStyle({
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))'
    });
  });
});

describe('ResponsiveStatCard', () => {
  it('should render label and value', () => {
    render(
      <ResponsiveStatCard 
        label="Total Users" 
        value={1234} 
      />
    );
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('should render string value', () => {
    render(
      <ResponsiveStatCard 
        label="Status" 
        value="Active" 
      />
    );
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    render(
      <ResponsiveStatCard 
        label="Revenue" 
        value="$1000"
        icon={<span>💰</span>}
      />
    );
    
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('should render with positive change', () => {
    render(
      <ResponsiveStatCard 
        label="Growth" 
        value={100}
        change={15}
        trend="up"
      />
    );
    
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('should render with negative change', () => {
    render(
      <ResponsiveStatCard 
        label="Decrease" 
        value={85}
        change={-10}
        trend="down"
      />
    );
    
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('↓')).toBeInTheDocument();
  });

  it('should render with neutral trend', () => {
    render(
      <ResponsiveStatCard 
        label="Stable" 
        value={100}
        change={0}
        trend="neutral"
      />
    );
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('should use neutral trend by default', () => {
    render(
      <ResponsiveStatCard 
        label="Value" 
        value={50}
        change={5}
      />
    );
    
    const changeElement = screen.getByText('→');
    expect(changeElement).toBeInTheDocument();
  });

  it('should not render change when not provided', () => {
    render(
      <ResponsiveStatCard 
        label="Value" 
        value={50}
      />
    );
    
    // The change indicator should not be present (look for the percentage text)
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
