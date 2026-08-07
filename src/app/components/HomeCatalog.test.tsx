import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeCatalog } from './HomeCatalog';

describe('HomeCatalog', () => {
  it('shows a factual product section without fabricated social proof', async () => {
    render(<HomeCatalog />);

    expect(await screen.findByRole('heading', { name: /selected gear/i })).toBeInTheDocument();
    expect(screen.queryByText(/12,000|happy gamers|real gamers/i)).not.toBeInTheDocument();
  });
});
