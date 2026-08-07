import { render, screen, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

it('uses light mode when no saved preference exists', () => {
  localStorage.clear();
  render(
    <ThemeProvider>
      <span>store</span>
    </ThemeProvider>
  );
  expect(document.documentElement.classList.contains('light')).toBe(true);
  expect(screen.getByText('store')).toBeInTheDocument();
});

it('renders light before restoring a saved dark preference', async () => {
  localStorage.setItem('byteforge-theme', 'dark');

  expect(
    renderToStaticMarkup(
      <ThemeProvider>
        <ThemeLabel />
      </ThemeProvider>
    )
  ).toContain('light');

  render(
    <ThemeProvider>
      <ThemeLabel />
    </ThemeProvider>
  );
  await waitFor(() => expect(screen.getByText('dark')).toBeInTheDocument());
  expect(document.documentElement.classList.contains('light')).toBe(false);
});

function ThemeLabel() {
  const { theme } = useTheme();
  return <span>{theme}</span>;
}
