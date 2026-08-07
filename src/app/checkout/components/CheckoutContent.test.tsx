import { afterEach, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '@/features/cart/CartContext';
import CheckoutContent, { validateDeliveryForm } from './CheckoutContent';

const { createOrderMock } = vi.hoisted(() => ({ createOrderMock: vi.fn() }));

vi.mock('@/features/orders/order-service', () => ({ createOrder: createOrderMock }));

const product = {
  id: 42,
  slug: 'stock-aware-mouse',
  name: 'Stock-aware Mouse',
  brand: 'ByteForge',
  categoryId: 'mice',
  categoryName: 'Mice',
  priceTHB: 1990,
  image: '/mouse.jpg',
  imageAlt: 'Mouse',
  stockQuantity: 3,
};

beforeEach(() => window.localStorage.clear());
afterEach(() => createOrderMock.mockReset());

it('blocks review until required delivery details are entered', async () => {
  render(<CartProvider><CheckoutContent /></CartProvider>);
  await userEvent.click(screen.getByRole('button', { name: /review order/i }));
  expect(await screen.findByText(/enter your name and delivery address/i)).toBeInTheDocument();
});

it('rejects malformed email, Thai phone, and postal code before review', () => {
  expect(validateDeliveryForm({
    email: 'not-an-email',
    firstName: 'Ake',
    lastName: 'Ky',
    address: '99 ถนนสุขุมวิท',
    city: 'วัฒนา',
    province: 'กรุงเทพมหานคร',
    postalCode: '101',
    phone: '1234567',
  })).toEqual({
    email: 'Enter a valid email address.',
    postalCode: 'Enter a 5-digit postal code.',
    phone: 'Enter a Thai phone number starting with 0.',
  });
});

it('accepts delivery details with a valid Thai mobile number', () => {
  expect(validateDeliveryForm({
    email: 'ake@example.com',
    firstName: 'Ake',
    lastName: 'Ky',
    address: '99 ถนนสุขุมวิท',
    city: 'วัฒนา',
    province: 'กรุงเทพมหานคร',
    postalCode: '10110',
    phone: '081-234-5678',
  })).toEqual({});
});

it('clears the cart after a configured API order succeeds', async () => {
  window.localStorage.setItem('byteforge-cart', JSON.stringify([{ product, quantity: 1 }]));
  createOrderMock.mockResolvedValue({ mode: 'submitted' });
  const user = userEvent.setup();
  render(<CartProvider><CheckoutContent /></CartProvider>);

  await screen.findByText(product.name);
  await user.type(screen.getByLabelText(/email address/i), 'ake@example.com');
  await user.type(screen.getByLabelText(/first name/i), 'Ake');
  await user.type(screen.getByLabelText(/last name/i), 'Ky');
  await user.type(screen.getByLabelText(/street address/i), '99 ถนนสุขุมวิท');
  await user.type(screen.getByLabelText(/city \/ district/i), 'วัฒนา');
  await user.type(screen.getByLabelText(/province/i), 'กรุงเทพมหานคร');
  await user.type(screen.getByLabelText(/postal code/i), '10110');
  await user.type(screen.getByLabelText(/phone number/i), '0812345678');
  await user.click(screen.getByRole('button', { name: /review order/i }));
  await user.click(await screen.findByRole('button', { name: /submit order/i }));

  expect(await screen.findByText(/your cart has been cleared/i)).toBeInTheDocument();
  await waitFor(() => expect(JSON.parse(window.localStorage.getItem('byteforge-cart') ?? 'null')).toEqual([]));
});
