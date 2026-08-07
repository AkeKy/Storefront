import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/context/ThemeContext';

it('uses light mode when no saved preference exists', () => {
  localStorage.clear();
  render(<ThemeProvider><span>store</span></ThemeProvider>);
  expect(document.documentElement.classList.contains('light')).toBe(true);
  expect(screen.getByText('store')).toBeInTheDocument();
});
