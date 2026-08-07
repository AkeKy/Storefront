import { render, screen, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

it('uses dark mode when no saved preference exists', () => {
  localStorage.clear();
  render(
    <ThemeProvider>
      <span>store</span>
    </ThemeProvider>
  );
  expect(document.documentElement.classList.contains('light')).toBe(false);
  expect(screen.getByText('store')).toBeInTheDocument();
});

it('renders dark before restoring a saved light preference', async () => {
  localStorage.setItem('byteforge-theme', 'light');

  expect(
    renderToStaticMarkup(
      <ThemeProvider>
        <ThemeLabel />
      </ThemeProvider>
    )
  ).toContain('dark');

  render(
    <ThemeProvider>
      <ThemeLabel />
    </ThemeProvider>
  );
  await waitFor(() => expect(screen.getByText('light')).toBeInTheDocument());
  expect(document.documentElement.classList.contains('light')).toBe(true);
});

function ThemeLabel() {
  const { theme } = useTheme();
  return <span>{theme}</span>;
}
