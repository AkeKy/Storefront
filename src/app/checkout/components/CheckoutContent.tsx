'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/features/cart/CartContext';
import { createOrder, type OrderSubmissionResult } from '@/features/orders/order-service';

const currency = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
type DeliveryForm = { email: string; firstName: string; lastName: string; address: string; city: string; province: string; postalCode: string; phone: string };
const initialForm: DeliveryForm = { email: '', firstName: '', lastName: '', address: '', city: '', province: '', postalCode: '', phone: '' };

export default function CheckoutContent() {
  const { items, itemCount, subtotalTHB, updateQuantity, removeItem } = useCart();
  const [form, setForm] = useState(initialForm);
  const [reviewing, setReviewing] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [result, setResult] = useState<OrderSubmissionResult>();
  const shippingTHB = subtotalTHB === 0 || subtotalTHB >= 1500 ? 0 : 80;
  const totalTHB = subtotalTHB + shippingTHB;

  const updateField = (key: keyof DeliveryForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const validate = () => {
    const required = [form.email, form.firstName, form.lastName, form.address, form.city, form.province, form.postalCode, form.phone];
    if (required.some((value) => !value.trim())) {
      setValidationError('Enter your name and delivery address, plus contact details, before reviewing your order.');
      return false;
    }
    setValidationError('');
    return true;
  };
  const reviewOrder = () => { if (validate()) setReviewing(true); };
  const submitOrder = async () => {
    setSubmissionError('');
    try {
      const token = window.localStorage.getItem('byteforge-token') ?? undefined;
      setResult(await createOrder(items, token));
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'We could not submit your order. Please try again.');
    }
  };

  if (result) return <div className="flex min-h-screen items-center justify-center px-6 pt-24"><div className="max-w-md text-center"><Icon name="CheckIcon" size={40} className="mx-auto mb-5 text-primary" /><h1 className="text-display-md">ORDER CONFIRMED</h1><p className="mt-4 text-muted-foreground">{result.mode === 'demo' ? 'Demo-mode order recorded locally. No payment or backend order was submitted.' : 'Your order request was submitted successfully.'}</p><Link href="/products" className="btn-primary mt-8">Continue shopping</Link></div></div>;

  return <div className="mx-auto max-w-screen-xl px-6 pb-16 pt-28"><Link href="/products" className="text-sm font-semibold text-primary hover:underline">← Continue shopping</Link><h1 className="mt-4 text-display-md">CHECKOUT</h1><div className="mt-8 grid gap-8 lg:grid-cols-5"><section className="surface-card p-6 lg:col-span-3"><h2 className="text-xl font-bold">Delivery details</h2>{validationError && <p role="alert" className="mt-4 rounded-lg border border-destructive p-3 text-sm text-destructive">{validationError}</p>}{reviewing ? <div className="mt-6"><h3 className="font-bold">Review your order</h3><p className="mt-2 text-sm text-muted-foreground">{form.firstName} {form.lastName}, {form.address}, {form.city}, {form.province} {form.postalCode}</p>{submissionError && <div role="alert" className="mt-4 rounded-lg border border-destructive p-3 text-sm text-destructive">{submissionError}<button className="ml-3 font-bold underline" onClick={submitOrder}>Retry</button></div>}<div className="mt-6 flex gap-3"><button className="btn-outline" onClick={() => setReviewing(false)}>Edit details</button><button className="btn-primary" onClick={submitOrder} disabled={items.length === 0}>Submit order · {currency.format(totalTHB)}</button></div></div> : <><div className="mt-5 grid gap-4 sm:grid-cols-2">{([['email', 'Email address'], ['firstName', 'First name'], ['lastName', 'Last name'], ['address', 'Street address'], ['city', 'City / district'], ['province', 'Province'], ['postalCode', 'Postal code'], ['phone', 'Phone number']] as Array<[keyof DeliveryForm, string]>).map(([key, label]) => <label key={key} className={key === 'address' ? 'sm:col-span-2' : ''}><span className="mb-1 block text-sm font-semibold">{label}</span><input className="checkout-input w-full" value={form[key]} onChange={(event) => updateField(key, event.target.value)} /></label>)}</div><button className="btn-primary mt-6 w-full justify-center" onClick={reviewOrder}>Review order</button></>}</section><aside className="surface-card h-fit p-6 lg:col-span-2"><h2 className="text-xl font-bold">Order summary <span className="text-sm text-muted-foreground">({itemCount})</span></h2>{items.length === 0 ? <p className="mt-4 text-muted-foreground">Your cart is empty.</p> : <div className="mt-5 space-y-4">{items.map((item) => <div key={item.product.id} className="flex gap-3"><div className="relative h-16 w-16 overflow-hidden rounded bg-muted"><AppImage src={item.product.image} alt={item.product.imageAlt} fill sizes="64px" className="object-cover" /></div><div className="min-w-0 flex-1"><p className="font-semibold">{item.product.name}</p><p className="text-sm text-muted-foreground">{currency.format(item.product.priceTHB)}</p><div className="mt-2 flex items-center gap-2"><button aria-label={`Decrease ${item.product.name} quantity`} onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button aria-label={`Increase ${item.product.name} quantity`} onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button><button className="ml-auto text-sm text-destructive" onClick={() => removeItem(item.product.id)}>Remove</button></div></div></div>)}</div>}<div className="mt-6 space-y-2 border-t pt-4 text-sm"><p className="flex justify-between"><span>Subtotal</span><span>{currency.format(subtotalTHB)}</span></p><p className="flex justify-between"><span>Delivery</span><span>{shippingTHB === 0 ? 'Free' : currency.format(shippingTHB)}</span></p><p className="flex justify-between text-lg font-bold"><span>Total</span><span>{currency.format(totalTHB)}</span></p></div><p className="mt-4 text-xs text-muted-foreground">No payment is collected in this checkout.</p></aside></div></div>;
}
