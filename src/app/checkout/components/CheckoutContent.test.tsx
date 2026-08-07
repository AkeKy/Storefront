import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '@/features/cart/CartContext';
import CheckoutContent from './CheckoutContent';

it('blocks review until required delivery details are entered', async () => {
  render(<CartProvider><CheckoutContent /></CartProvider>);
  await userEvent.click(screen.getByRole('button', { name: /review order/i }));
  expect(await screen.findByText(/enter your name and delivery address/i)).toBeInTheDocument();
});
