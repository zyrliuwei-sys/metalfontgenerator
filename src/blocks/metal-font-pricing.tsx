import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpRight, Check, Sparkles, X } from 'lucide-react';

import { signInAsGuest, useSession } from '@/core/auth/client';
import {
  metalFontPricingOptions,
  type MetalFontPricingBilling,
  type MetalFontPricingOption,
  type MetalFontPricingTier,
} from '@/config/pricing';
import { apiPost } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';

const TIERS: MetalFontPricingTier[] = ['creator'];

function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(priceInCents / 100);
}

// No sign-up wall: visitors without a session get a silent guest account,
// the checkout attaches to it, and a later sign-in claims the purchases.
function useMetalCheckout() {
  const { data: session } = useSession();
  const [error, setError] = useState('');
  const [preparingGuest, setPreparingGuest] = useState(false);

  const checkoutMutation = useMutation({
    mutationFn: (option: MetalFontPricingOption) =>
      apiPost<{ checkout_url: string }>('/api/payment/checkout', {
        product_id: option.productId,
        redirect: `${window.location.pathname}#pricing`,
      }),
    onSuccess: ({ checkout_url }) => {
      window.location.assign(checkout_url);
    },
    onError: (checkoutError: any) => {
      setError(checkoutError?.message || m['metal.pricing.checkout_error']());
    },
  });

  const startCheckout = async (option: MetalFontPricingOption) => {
    setError('');

    if (!session?.user) {
      setPreparingGuest(true);
      const guestCreated = await signInAsGuest();
      setPreparingGuest(false);
      if (!guestCreated) {
        setError(m['metal.guest.error']());
        return;
      }
    }

    checkoutMutation.mutate(option);
  };

  return {
    sessionPending: !session && session !== null,
    error,
    preparingGuest,
    checkoutMutation,
    startCheckout,
  };
}

export function MetalPricingPicker() {
  const { error, preparingGuest, checkoutMutation, startCheckout } =
    useMetalCheckout();
  const [billing, setBilling] = useState<MetalFontPricingBilling>('one_time');

  const visibleOptions = (tier: MetalFontPricingTier) =>
    metalFontPricingOptions.filter(
      (option) => option.tier === tier && option.billing === billing
    );

  const optionActionLabel =
    billing === 'one_time'
      ? m['metal.pricing.buy']()
      : m['metal.pricing.subscribe']();

  return (
    <div className="metal-pricing-picker">
      <div className="metal-pricing-toolbar">
        <div className="metal-pricing-switch" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={billing === 'one_time'}
            className={billing === 'one_time' ? 'is-selected' : ''}
            onClick={() => setBilling('one_time')}
          >
            {m['metal.pricing.one_time']()}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={billing === 'monthly'}
            className={billing === 'monthly' ? 'is-selected' : ''}
            onClick={() => setBilling('monthly')}
          >
            {m['metal.pricing.monthly']()}
          </button>
        </div>
        <p className="metal-pricing-multiplier">
          <Sparkles size={14} aria-hidden="true" />
          {m['metal.pricing.price_note']()}
        </p>
      </div>

      <div className="metal-pricing-tier-grid">
        {TIERS.map((tier) => {
          const options = visibleOptions(tier);
          const title = m['metal.pricing.creator']();
          const description = m['metal.pricing.creator_desc']();

          return (
            <article className="metal-pricing-tier" key={tier}>
              <div className="metal-pricing-tier-heading">
                <div>
                  <span className="metal-pricing-tier-index">01</span>
                  <h3>{title}</h3>
                </div>
                <p>{description}</p>
              </div>

              <div className="metal-pricing-option-grid">
                {options.map((option) => {
                  const isPending =
                    checkoutMutation.isPending &&
                    checkoutMutation.variables?.productId === option.productId;
                  return (
                    <div
                      className={`metal-pricing-card ${option.popular ? 'is-popular' : ''}`}
                      key={option.productId}
                    >
                      {option.popular ? (
                        <span className="metal-pricing-popular">
                          {m['metal.pricing.popular']()}
                        </span>
                      ) : null}
                      <div className="metal-pricing-price">
                        {formatPrice(option.priceInCents)}
                        {billing === 'monthly' ? (
                          <span className="metal-pricing-period">
                            {m['metal.pricing.per_month']()}
                          </span>
                        ) : null}
                      </div>
                      <strong>
                        {m['metal.pricing.credits']({ count: option.credits })}
                      </strong>
                      <span className="metal-pricing-generations">
                        {m['metal.pricing.generations']({
                          count: option.generations,
                        })}
                      </span>
                      <div className="metal-pricing-includes">
                        <Check size={14} aria-hidden="true" />
                        <span>{m['metal.pricing.includes']()}</span>
                      </div>
                      <button
                        type="button"
                        className="metal-pricing-buy"
                        disabled={preparingGuest || checkoutMutation.isPending}
                        onClick={() => startCheckout(option)}
                      >
                        {isPending
                          ? m['metal.pricing.opening_checkout']()
                          : preparingGuest
                            ? m['metal.pricing.preparing']()
                            : optionActionLabel}
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      {error ? (
        <p className="metal-pricing-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="metal-pricing-footnote">
        {billing === 'one_time'
          ? m['metal.pricing.one_time_note']()
          : m['metal.pricing.monthly_note']()}
      </p>
    </div>
  );
}

export function MetalPaywallModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="metal-login-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="metal-login-panel metal-paywall-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="metal-paywall-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="metal-login-panel-topline">
          <span>{m['metal.paywall.kicker']()}</span>
          <button
            type="button"
            className="metal-login-close"
            onClick={onClose}
            aria-label={m['metal.auth.close']()}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
        <div className="metal-login-heading">
          <h2 id="metal-paywall-title">{m['metal.paywall.title']()}</h2>
          <p>{m['metal.paywall.description']()}</p>
        </div>
        <div className="metal-paywall-body">
          <MetalPricingPicker />
        </div>
      </section>
    </div>
  );
}

export function MetalFontPricing() {
  return (
    <section className="metal-pricing-section" id="pricing">
      <div className="metal-pricing-heading">
        <div>
          <p className="metal-kicker">{m['metal.pricing.kicker']()}</p>
          <h2>{m['metal.pricing.title']()}</h2>
        </div>
        <p>{m['metal.pricing.description']()}</p>
      </div>

      <MetalPricingPicker />
    </section>
  );
}
