'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/features/cart/CartContext';
import { useLanguage, type MessageKey } from '@/features/i18n/LanguageContext';
import { createOrder, type OrderSubmissionResult } from '@/features/orders/order-service';

const currency = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
});
export type DeliveryForm = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
};
type DeliveryErrorCode =
  | 'validation.required'
  | 'validation.email'
  | 'validation.postalCode'
  | 'validation.phone';
type DeliveryErrors = Partial<Record<keyof DeliveryForm, DeliveryErrorCode>>;

const initialForm: DeliveryForm = {
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
  phone: '',
};
const requiredFields: Array<keyof DeliveryForm> = [
  'email',
  'firstName',
  'lastName',
  'address',
  'city',
  'province',
  'postalCode',
  'phone',
];
const fieldMeta: Record<
  keyof DeliveryForm,
  {
    labelKey: MessageKey;
    type?: 'email' | 'tel' | 'text';
    autoComplete: string;
    inputMode?: 'numeric' | 'tel';
  }
> = {
  email: { labelKey: 'checkout.email', type: 'email', autoComplete: 'email' },
  firstName: { labelKey: 'checkout.firstName', autoComplete: 'given-name' },
  lastName: { labelKey: 'checkout.lastName', autoComplete: 'family-name' },
  address: { labelKey: 'checkout.address', autoComplete: 'street-address' },
  city: { labelKey: 'checkout.city', autoComplete: 'address-level2' },
  province: { labelKey: 'checkout.province', autoComplete: 'address-level1' },
  postalCode: { labelKey: 'checkout.postalCode', autoComplete: 'postal-code', inputMode: 'numeric' },
  phone: { labelKey: 'checkout.phone', type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
};

export function validateDeliveryForm(form: DeliveryForm): DeliveryErrors {
  const errors: DeliveryErrors = {};
  requiredFields.forEach((field) => {
    if (!form[field].trim()) errors[field] = 'validation.required';
  });
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = 'validation.email';
  if (form.postalCode.trim() && !/^\d{5}$/.test(form.postalCode.trim()))
    errors.postalCode = 'validation.postalCode';
  const phoneDigits = form.phone.replace(/[\s-]/g, '');
  if (form.phone.trim() && !/^0\d{8,9}$/.test(phoneDigits))
    errors.phone = 'validation.phone';
  return errors;
}

export default function CheckoutContent() {
  const { items, itemCount, subtotalTHB, updateQuantity, removeItem, clearCart } = useCart();
  const { t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [reviewing, setReviewing] = useState(false);
  const [errors, setErrors] = useState<DeliveryErrors>({});
  const [submissionError, setSubmissionError] = useState('');
  const [result, setResult] = useState<OrderSubmissionResult>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasValidationError = Object.values(errors).some(Boolean);

  const updateField = (key: keyof DeliveryForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const reviewOrder = () => {
    const nextErrors = validateDeliveryForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setReviewing(true);
  };
  const submitOrder = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmissionError('');
    try {
      const token = window.localStorage.getItem('byteforge-token') ?? undefined;
      const nextResult = await createOrder(items, token);
      if (nextResult.mode === 'submitted') clearCart();
      setResult(nextResult);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : t('catalog.loadError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="max-w-md text-center">
          <Icon name="CheckIcon" size={40} className="mx-auto mb-5 text-primary" />
          <h1 className="text-display-md">
            {result.mode === 'demo' ? t('checkout.previewComplete') : t('checkout.orderConfirmed')}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {result.mode === 'demo'
              ? t('checkout.previewResult')
              : t('checkout.submittedResult')}
          </p>
          <Link href="/products" className="btn-primary mt-8">
            {t('checkout.continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-6 pb-16 pt-28">
      <Link href="/products" className="text-sm font-semibold text-primary hover:underline">
        ← {t('checkout.continueShopping')}
      </Link>
      <h1 className="mt-4 text-display-md">{t('checkout.title')}</h1>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
        {t('checkout.demoNotice')}
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <section className="surface-card p-6 lg:col-span-3">
          <h2 className="text-xl font-bold">{t('checkout.deliveryDetails')}</h2>
          {hasValidationError && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-destructive p-3 text-sm text-destructive"
            >
              {t('checkout.validationSummary')}
            </p>
          )}
          {reviewing ? (
            <div className="mt-6">
              <h3 className="font-bold">{t('checkout.reviewTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {form.firstName} {form.lastName}, {form.address}, {form.city}, {form.province}{' '}
                {form.postalCode}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {t('checkout.reviewNotice')}
              </p>
              {submissionError && (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-destructive p-3 text-sm text-destructive"
                >
                  {submissionError}
                  <button
                    className="ml-3 font-bold underline"
                    onClick={submitOrder}
                    disabled={isSubmitting}
                  >
                    {t('checkout.retry')}
                  </button>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  className="btn-outline"
                  onClick={() => setReviewing(false)}
                  disabled={isSubmitting}
                >
                  {t('checkout.editDetails')}
                </button>
                <button
                  className="btn-primary"
                  onClick={submitOrder}
                  disabled={items.length === 0 || isSubmitting}
                >
                  {isSubmitting
                    ? t('checkout.submitting')
                    : t('checkout.submitOrder', { total: currency.format(subtotalTHB) })}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {requiredFields.map((key) => {
                  const meta = fieldMeta[key];
                  const error = errors[key];
                  const errorId = `checkout-${key}-error`;
                  return (
                    <label key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                      <span className="mb-1 block text-sm font-semibold">{t(meta.labelKey)}</span>
                      <input
                        className="checkout-input w-full"
                        type={meta.type ?? 'text'}
                        autoComplete={meta.autoComplete}
                        inputMode={meta.inputMode}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? errorId : undefined}
                        value={form[key]}
                        onChange={(event) => updateField(key, event.target.value)}
                      />
                      {error && (
                        <p id={errorId} role="alert" className="mt-1 text-sm text-destructive">
                          {t(error)}
                        </p>
                      )}
                    </label>
                  );
                })}
              </div>
              <button className="btn-primary mt-6 w-full justify-center" onClick={reviewOrder}>
                {t('checkout.reviewOrder')}
              </button>
            </>
          )}
        </section>
        <aside className="surface-card h-fit p-6 lg:col-span-2">
          <h2 className="text-xl font-bold">
            {t('checkout.orderSummary')}{' '}
            <span className="text-sm text-muted-foreground">({itemCount})</span>
          </h2>
          {items.length === 0 ? (
            <p className="mt-4 text-muted-foreground">{t('checkout.emptyCart')}</p>
          ) : (
            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded bg-muted">
                    <AppImage
                      src={item.product.image}
                      alt={item.product.imageAlt}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {currency.format(item.product.priceTHB)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        aria-label={t('checkout.decreaseQuantity', { name: item.product.name })}
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        disabled={isSubmitting}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label={t('checkout.increaseQuantity', { name: item.product.name })}
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={isSubmitting}
                      >
                        +
                      </button>
                      <button
                        className="ml-auto text-sm text-destructive"
                        onClick={() => removeItem(item.product.id)}
                        disabled={isSubmitting}
                      >
                        {t('checkout.remove')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 space-y-2 border-t pt-4 text-sm">
            <p className="flex justify-between">
              <span>{t('checkout.subtotal')}</span>
              <span>{currency.format(subtotalTHB)}</span>
            </p>
            <p className="flex justify-between text-lg font-bold">
              <span>{t('checkout.total')}</span>
              <span>{currency.format(subtotalTHB)}</span>
            </p>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {t('checkout.deliveryUnavailable')}
          </p>
        </aside>
      </div>
    </div>
  );
}
