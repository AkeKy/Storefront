import { afterEach, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '@/features/cart/CartContext';
import { LanguageProvider } from '@/features/i18n/LanguageContext';
import CheckoutContent, { validateDeliveryForm } from './CheckoutContent';

const { createOrderMock } = vi.hoisted(() => ({ createOrderMock: vi.fn() }));

vi.mock('@/features/orders/order-service', () => ({ createOrder: createOrderMock }));

const product = {
  id: 42,
  slug: 'stock-aware-mouse',
  name: 'Stock-aware Mouse',
  brand: 'ByteForge',
  categoryId: 'mouse',
  categoryName: 'Mouse',
  priceTHB: 1990,
  image: '/mouse.jpg',
  imageAlt: 'Mouse',
  stockQuantity: 3,
};

function renderCheckout() {
  return render(
    <LanguageProvider>
      <CartProvider>
        <CheckoutContent />
      </CartProvider>
    </LanguageProvider>
  );
}

beforeEach(() => window.localStorage.clear());
afterEach(() => createOrderMock.mockReset());

it('blocks review until required delivery details are entered', async () => {
  renderCheckout();
  await userEvent.click(screen.getByRole('button', { name: /review order/i }));
  expect(await screen.findByText(/enter your name and delivery address/i)).toBeInTheDocument();
});

it('clears the validation alert after every invalid field is corrected', async () => {
  const user = userEvent.setup();
  renderCheckout();

  await user.click(screen.getByRole('button', { name: /review order/i }));
  expect(await screen.findByText(/enter your name and delivery address/i)).toBeInTheDocument();

  await user.type(screen.getByLabelText(/email address/i), 'ake@example.com');
  await user.type(screen.getByLabelText(/first name/i), 'Ake');
  await user.type(screen.getByLabelText(/last name/i), 'Ky');
  await user.type(screen.getByLabelText(/street address/i), '99 Sukhumvit Road');
  await user.type(screen.getByLabelText(/city \/ district/i), 'Watthana');
  await user.type(screen.getByLabelText(/province/i), 'Bangkok');
  await user.type(screen.getByLabelText(/postal code/i), '10110');
  await user.type(screen.getByLabelText(/phone number/i), '0812345678');

  expect(screen.queryByText(/enter your name and delivery address/i)).not.toBeInTheDocument();
});

it('rejects malformed email, Thai phone, and postal code before review', () => {
  expect(
    validateDeliveryForm({
      email: 'not-an-email',
      firstName: 'Ake',
      lastName: 'Ky',
      address: '99 ถนนสุขุมวิท',
      city: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      postalCode: '101',
      phone: '1234567',
    })
  ).toEqual({
    email: 'validation.email',
    postalCode: 'validation.postalCode',
    phone: 'validation.phone',
  });
});

it('renders Thai delivery labels and validation guidance when Thai is selected', async () => {
  window.localStorage.setItem('gadget-arena-locale', 'th');
  const user = userEvent.setup();

  renderCheckout();

  expect(await screen.findByLabelText('อีเมล')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'ตรวจสอบคำสั่งซื้อ' }));
  expect(await screen.findByText(/กรอกชื่อและที่อยู่จัดส่ง/)).toBeInTheDocument();
});

it('accepts delivery details with a valid Thai mobile number', () => {
  expect(
    validateDeliveryForm({
      email: 'ake@example.com',
      firstName: 'Ake',
      lastName: 'Ky',
      address: '99 ถนนสุขุมวิท',
      city: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      postalCode: '10110',
      phone: '081-234-5678',
    })
  ).toEqual({});
});

it('clears the cart after a configured API order succeeds', async () => {
  window.localStorage.setItem('byteforge-cart', JSON.stringify([{ product, quantity: 1 }]));
  createOrderMock.mockResolvedValue({ mode: 'submitted' });
  const user = userEvent.setup();
  renderCheckout();

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
  await waitFor(() =>
    expect(JSON.parse(window.localStorage.getItem('byteforge-cart') ?? 'null')).toEqual([])
  );
});

it('keeps a stored cart after a demo checkout preview', async () => {
  window.localStorage.setItem('byteforge-cart', JSON.stringify([{ product, quantity: 1 }]));
  createOrderMock.mockResolvedValue({ mode: 'demo' });
  const user = userEvent.setup();
  renderCheckout();

  await screen.findByText(product.name);
  await user.type(screen.getByLabelText(/email address/i), 'ake@example.com');
  await user.type(screen.getByLabelText(/first name/i), 'Ake');
  await user.type(screen.getByLabelText(/last name/i), 'Ky');
  await user.type(screen.getByLabelText(/street address/i), '99 Sukhumvit Road');
  await user.type(screen.getByLabelText(/city \/ district/i), 'Watthana');
  await user.type(screen.getByLabelText(/province/i), 'Bangkok');
  await user.type(screen.getByLabelText(/postal code/i), '10110');
  await user.type(screen.getByLabelText(/phone number/i), '0812345678');
  await user.click(screen.getByRole('button', { name: /review order/i }));
  await user.click(await screen.findByRole('button', { name: /submit order/i }));

  expect(await screen.findByText(/your cart is unchanged/i)).toBeInTheDocument();
  await waitFor(() =>
    expect(JSON.parse(window.localStorage.getItem('byteforge-cart') ?? 'null')).toEqual([
      { product, quantity: 1 },
    ])
  );
});

it('prevents duplicate submissions while an order request is pending', async () => {
  window.localStorage.setItem('byteforge-cart', JSON.stringify([{ product, quantity: 1 }]));
  let resolveOrder: (result: { mode: 'submitted' }) => void;
  createOrderMock.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveOrder = resolve;
      })
  );
  const user = userEvent.setup();
  renderCheckout();

  await completeDeliveryDetails(user);
  const submitOrder = await screen.findByRole('button', { name: /submit order/i });
  await user.click(submitOrder);
  await user.click(submitOrder);

  expect(createOrderMock).toHaveBeenCalledTimes(1);
  expect(submitOrder).toBeDisabled();
  expect(screen.getByText(/submitting order/i)).toBeInTheDocument();

  resolveOrder!({ mode: 'submitted' });
  expect(await screen.findByText(/your cart has been cleared/i)).toBeInTheDocument();
});

it('shows the item subtotal as the checkout total without a delivery quote', async () => {
  window.localStorage.setItem('byteforge-cart', JSON.stringify([{ product, quantity: 1 }]));
  renderCheckout();

  await screen.findByText(product.name);
  expect(screen.getByText(/delivery quote unavailable in demo/i)).toBeInTheDocument();
  const subtotalRow = screen.getByText('Subtotal').closest('p');
  const totalRow = screen.getByText('Total').closest('p');
  expect(subtotalRow).not.toBeNull();
  expect(totalRow).not.toBeNull();
  const subtotalAmount = within(subtotalRow!).getByText('฿1,990');
  const totalAmount = within(totalRow!).getByText('฿1,990');
  expect(totalAmount.textContent).toBe(subtotalAmount.textContent);
  expect(screen.queryByText(/^Delivery$/i)).not.toBeInTheDocument();
});

async function completeDeliveryDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/email address/i), 'ake@example.com');
  await user.type(screen.getByLabelText(/first name/i), 'Ake');
  await user.type(screen.getByLabelText(/last name/i), 'Ky');
  await user.type(screen.getByLabelText(/street address/i), '99 Sukhumvit Road');
  await user.type(screen.getByLabelText(/city \/ district/i), 'Watthana');
  await user.type(screen.getByLabelText(/province/i), 'Bangkok');
  await user.type(screen.getByLabelText(/postal code/i), '10110');
  await user.type(screen.getByLabelText(/phone number/i), '0812345678');
  await user.click(screen.getByRole('button', { name: /review order/i }));
}
