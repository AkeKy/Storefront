'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface CartItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
  alt: string;
}

const cartItems: CartItem[] = [
  {
    id: 1,
    name: 'Razer DeathAdder V3 Pro',
    brand: 'Razer',
    price: 149.99,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1666102710819-7c1387125d40',
    alt: 'Black ergonomic gaming mouse on dark surface',
  },
  {
    id: 2,
    name: 'SteelSeries Apex Pro TKL',
    brand: 'SteelSeries',
    price: 179.99,
    quantity: 1,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1faeefae7-1772850001582.png',
    alt: 'TKL mechanical keyboard with RGB lighting',
  },
  {
    id: 3,
    name: 'HyperX Cloud III Wireless',
    brand: 'HyperX',
    price: 199.99,
    quantity: 1,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1af022901-1772850004857.png',
    alt: 'Wireless gaming headset with cushioned ear cups',
  },
];

type PaymentMethod = 'card' | 'paypal' | 'crypto';
type Step = 'shipping' | 'payment' | 'confirm';

const CheckoutContent: React.FC = () => {
  const [quantities, setQuantities] = useState<Record<number, number>>(
    Object.fromEntries(cartItems.map((item) => [item.id, item.quantity]))
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [step, setStep] = useState<Step>('shipping');
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Form state
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    phone: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    saveInfo: false,
    sameAsBilling: true,
  });

  const updateField = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * (quantities[item.id] || 1),
    0
  );
  const shipping = subtotal > 75 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const updateQty = (id: number, delta: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + delta) }));
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
  };

  if (orderPlaced) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6 neon-glow">
            <Icon name="CheckIcon" size={36} className="text-primary" />
          </div>
          <h2 className="text-display-md mb-4">
            ORDER <span className="gradient-text-primary">CONFIRMED</span>
          </h2>
          <p className="text-muted-foreground mb-2 text-base">
            Your order #GA-{Math.floor(Math.random() * 90000) + 10000} has been placed.
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            Estimated delivery: <span className="text-foreground font-bold">Aug 7–8, 2026</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary text-sm py-3 px-6">
              Back to Home
              <Icon name="HomeIcon" size={16} />
            </Link>
            <Link href="/products" className="btn-outline text-sm py-3 px-6">
              Keep Shopping
              <Icon name="ArrowRightIcon" size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/products"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium mb-4"
        >
          <Icon name="ArrowLeftIcon" size={16} />
          Continue Shopping
        </Link>
        <h1 className="text-display-md">
          CHECK<span className="gradient-text-primary">OUT</span>
        </h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-10">
        {(['shipping', 'payment', 'confirm'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => {
                if (s === 'shipping') setStep('shipping');
                if (s === 'payment' && step === 'confirm') setStep('payment');
              }}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${step === s ? 'text-primary' : i < (['shipping', 'payment', 'confirm'] as Step[]).indexOf(step) ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${step === s ? 'bg-primary text-primary-foreground neon-glow' : 'border border-border'}`}
              >
                {i + 1}
              </span>
              <span className="capitalize hidden sm:block">{s}</span>
            </button>
            {i < 2 && <div className="flex-1 h-px bg-border max-w-[60px]" />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Forms */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Shipping Step */}
          {step === 'shipping' && (
            <div className="card-dark p-6">
              <h2 className="font-black text-lg text-foreground mb-5 flex items-center gap-2">
                <Icon name="MapPinIcon" size={20} className="text-primary" />
                Shipping Information
              </h2>
              <div className="flex flex-col gap-4">
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="checkout-input"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="checkout-input"
                  />

                  <input
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="checkout-input"
                  />
                </div>
                <input
                  placeholder="Street address"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="checkout-input"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="checkout-input"
                  />

                  <input
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className="checkout-input"
                  />

                  <input
                    placeholder="ZIP code"
                    value={form.zip}
                    onChange={(e) => updateField('zip', e.target.value)}
                    className="checkout-input col-span-2 sm:col-span-1"
                  />
                </div>
                <input
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="checkout-input"
                />

                {/* Shipping options */}
                <div className="mt-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Shipping Method
                  </p>
                  <div className="flex flex-col gap-2">
                    {[
                      {
                        label: 'Standard Shipping',
                        time: '3–5 business days',
                        price: subtotal > 75 ? 'Free' : '$9.99',
                      },
                      { label: 'Express Shipping', time: '1–2 business days', price: '$19.99' },
                      { label: 'Same-Day Delivery', time: 'Order before 3PM', price: '$29.99' },
                    ].map((option, i) => (
                      <label
                        key={option.label}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${i === 0 ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${i === 0 ? 'border-primary' : 'border-muted-foreground'}`}
                          >
                            {i === 0 && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.time}</p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-bold ${i === 0 ? 'text-primary' : 'text-foreground'}`}
                        >
                          {option.price}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setStep('payment')}
                  className="btn-primary w-full justify-center py-4 mt-2"
                >
                  Continue to Payment
                  <Icon name="ArrowRightIcon" size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Payment Step */}
          {step === 'payment' && (
            <div className="card-dark p-6">
              <h2 className="font-black text-lg text-foreground mb-5 flex items-center gap-2">
                <Icon name="CreditCardIcon" size={20} className="text-primary" />
                Payment Method
              </h2>

              {/* Method Tabs */}
              <div className="flex gap-2 mb-5">
                {(
                  [
                    { key: 'card', icon: 'CreditCardIcon', label: 'Card' },
                    { key: 'paypal', icon: 'GlobeAltIcon', label: 'PayPal' },
                    { key: 'crypto', icon: 'BoltIcon', label: 'Crypto' },
                  ] as { key: PaymentMethod; icon: string; label: string }[]
                ).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setPaymentMethod(m.key)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === m.key
                        ? 'bg-primary/15 border border-primary/40 text-primary'
                        : 'border border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    <Icon name={m.icon as any} size={16} />
                    {m.label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                      Card Number
                    </label>
                    <input
                      placeholder="1234 5678 9012 3456"
                      value={form.cardNumber}
                      onChange={(e) => updateField('cardNumber', e.target.value)}
                      className="checkout-input"
                      maxLength={19}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                      Name on Card
                    </label>
                    <input
                      placeholder="Full name"
                      value={form.cardName}
                      onChange={(e) => updateField('cardName', e.target.value)}
                      className="checkout-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                        Expiry
                      </label>
                      <input
                        placeholder="MM / YY"
                        value={form.cardExpiry}
                        onChange={(e) => updateField('cardExpiry', e.target.value)}
                        className="checkout-input"
                        maxLength={7}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                        CVV
                      </label>
                      <input
                        placeholder="•••"
                        value={form.cardCvv}
                        onChange={(e) => updateField('cardCvv', e.target.value)}
                        className="checkout-input"
                        maxLength={4}
                        type="password"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer mt-1">
                    <div
                      onClick={() => updateField('saveInfo', !form.saveInfo)}
                      className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${form.saveInfo ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.saveInfo ? 'left-5' : 'left-0.5'}`}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Save payment info for next time
                    </span>
                  </label>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="text-center py-10 border border-border rounded-xl">
                  <Icon name="GlobeAltIcon" size={40} className="text-blue-400 mx-auto mb-3" />
                  <p className="text-foreground font-bold mb-2">Connect with PayPal</p>
                  <p className="text-muted-foreground text-sm mb-4">
                    You&apos;ll be redirected to PayPal to complete payment.
                  </p>
                  <button className="btn-outline text-sm py-3 px-6">Connect PayPal</button>
                </div>
              )}

              {paymentMethod === 'crypto' && (
                <div className="text-center py-10 border border-border rounded-xl">
                  <Icon
                    name="BoltIcon"
                    size={40}
                    variant="solid"
                    className="text-yellow-400 mx-auto mb-3"
                  />
                  <p className="text-foreground font-bold mb-2">Pay with Crypto</p>
                  <p className="text-muted-foreground text-sm mb-4">
                    Accepts BTC, ETH, USDC. 2% discount applied.
                  </p>
                  <button className="btn-outline text-sm py-3 px-6">Generate Wallet Address</button>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('shipping')}
                  className="btn-outline py-3 px-5 text-sm"
                >
                  <Icon name="ArrowLeftIcon" size={14} />
                  Back
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="btn-primary flex-1 justify-center py-3 text-sm"
                >
                  Review Order
                  <Icon name="ArrowRightIcon" size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {step === 'confirm' && (
            <div className="card-dark p-6">
              <h2 className="font-black text-lg text-foreground mb-5 flex items-center gap-2">
                <Icon name="ClipboardDocumentCheckIcon" size={20} className="text-primary" />
                Review & Confirm
              </h2>

              {/* Shipping summary */}
              <div className="mb-5 p-4 bg-muted rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Shipping To
                  </p>
                  <button
                    onClick={() => setStep('shipping')}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {form.firstName || 'Jordan'} {form.lastName || 'Lee'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {form.address || '4821 Oak Street'}, {form.city || 'Austin'}, {form.state || 'TX'}{' '}
                  {form.zip || '78701'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {form.email || 'jordan.lee@email.com'}
                </p>
              </div>

              {/* Payment summary */}
              <div className="mb-5 p-4 bg-muted rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Payment
                  </p>
                  <button
                    onClick={() => setStep('payment')}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-sm font-bold text-foreground capitalize">
                  {paymentMethod === 'card'
                    ? `Card ending in ${form.cardNumber ? form.cardNumber.slice(-4) : '3456'}`
                    : paymentMethod === 'paypal'
                      ? 'PayPal'
                      : 'Cryptocurrency'}
                </p>
              </div>

              {/* Security note */}
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl mb-5">
                <Icon name="ShieldCheckIcon" size={16} className="text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Your payment is encrypted with 256-bit SSL. We never store card details.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('payment')}
                  className="btn-outline py-3 px-5 text-sm"
                >
                  <Icon name="ArrowLeftIcon" size={14} />
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  className="btn-primary flex-1 justify-center py-4 text-sm neon-glow"
                >
                  <Icon name="LockClosedIcon" size={14} />
                  Place Order · ${total.toFixed(2)}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2">
          <div className="card-dark p-6 sticky top-24">
            <h2 className="font-black text-base text-foreground mb-5 flex items-center gap-2">
              <Icon name="ShoppingCartIcon" size={18} className="text-primary" />
              Order Summary
              <span className="ml-auto tag-neon text-[10px]">{cartItems.length} items</span>
            </h2>

            {/* Cart Items */}
            <div className="flex flex-col gap-4 mb-5">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <AppImage
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground leading-tight truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1.5">{item.brand}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-xs"
                        >
                          −
                        </button>
                        <span className="px-2 text-xs font-bold text-foreground">
                          {quantities[item.id] || 1}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-xs"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-black text-primary">
                        ${(item.price * (quantities[item.id] || 1)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 flex flex-col gap-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span
                  className={
                    shipping === 0 ? 'text-primary font-bold' : 'text-foreground font-semibold'
                  }
                >
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span className="text-foreground font-semibold">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-3 mt-1 flex justify-between">
                <span className="font-black text-foreground text-base">Total</span>
                <span className="font-black text-primary text-xl">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Promo code */}
            <div className="mt-4 flex gap-2">
              <input placeholder="Promo code" className="checkout-input flex-1 text-sm py-2.5" />

              <button className="btn-outline py-2.5 px-4 text-sm">Apply</button>
            </div>

            {/* Trust badges */}
            <div className="mt-4 flex items-center justify-center gap-4 pt-4 border-t border-border">
              {[
                { icon: 'ShieldCheckIcon', label: 'Secure' },
                { icon: 'TruckIcon', label: 'Fast Ship' },
                { icon: 'ArrowPathIcon', label: '30-Day Returns' },
              ].map((badge) => (
                <div key={badge.label} className="flex flex-col items-center gap-1">
                  <Icon name={badge.icon as any} size={16} className="text-primary" />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutContent;
