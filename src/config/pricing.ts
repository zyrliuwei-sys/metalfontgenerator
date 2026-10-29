/**
 * Authoritative pricing catalog.
 *
 * The checkout API uses this as the SOURCE OF TRUTH for price/credits/duration.
 * Any price, credits, or plan info sent by the client is IGNORED — only the
 * product_id is honored, and everything else is looked up here.
 *
 * To change pricing, edit this file and redeploy. Admin UI cannot alter prices.
 */

import { PaymentInterval, PaymentType } from '@/core/payment/types';
import { creditsForPriceInCents } from '@/config/design-pricing';

export type PricingPlanInfo = {
  name: string;
  interval: PaymentInterval;
  intervalCount: number;
};

export type PricingProduct = {
  productId: string;
  productName: string;
  planName: string;
  description: string;
  type: PaymentType;
  priceInCents: number;
  currency: string;
  credits: number;
  creditsValidDays?: number;
  plan?: PricingPlanInfo;
};

export type MetalFontPricingBilling = 'one_time' | 'monthly';
export type MetalFontPricingTier = 'creator';

export type MetalFontPricingOption = PricingProduct & {
  tier: MetalFontPricingTier;
  billing: MetalFontPricingBilling;
  generations: number;
  popular?: boolean;
};

export const METAL_FONT_GENERATION_CREDITS = 25;

function metalFontOption(params: {
  productId: string;
  tier: MetalFontPricingTier;
  billing: MetalFontPricingBilling;
  priceInCents: number;
  credits: number;
  generations: number;
  popular?: boolean;
}): MetalFontPricingOption {
  const productName = 'Creator';
  const monthly = params.billing === 'monthly';
  return {
    productId: params.productId,
    productName,
    planName: productName,
    description: monthly
      ? `Metal Font ${productName} monthly credits`
      : `Metal Font ${productName} one-time credits`,
    type: monthly ? PaymentType.SUBSCRIPTION : PaymentType.ONE_TIME,
    priceInCents: params.priceInCents,
    currency: 'usd',
    credits: params.credits,
    creditsValidDays: monthly ? 31 : undefined,
    plan: monthly
      ? {
          name: `Metal Font ${productName}`,
          interval: PaymentInterval.MONTH,
          intervalCount: 1,
        }
      : undefined,
    tier: params.tier,
    billing: params.billing,
    generations: params.generations,
    popular: params.popular,
  };
}

/**
 * First version of the metal-font credit catalog.
 *
 * A 2K Nano Banana 2.1 generation currently costs about 3.0845 EvoLink
 * credits. The metal-font API charges 8x, so one 2K generation consumes 25
 * app credits. Product prices below sell app credits, not provider credits.
 */
export const metalFontPricingOptions: MetalFontPricingOption[] = [
  // Creator — one-time
  metalFontOption({
    productId: 'metal_creator_one_time_100',
    tier: 'creator',
    billing: 'one_time',
    priceInCents: 499,
    credits: 100,
    generations: 4,
  }),
  metalFontOption({
    productId: 'metal_creator_one_time_300',
    tier: 'creator',
    billing: 'one_time',
    priceInCents: 1299,
    credits: 300,
    generations: 12,
    popular: true,
  }),
  metalFontOption({
    productId: 'metal_creator_one_time_800',
    tier: 'creator',
    billing: 'one_time',
    priceInCents: 2999,
    credits: 800,
    generations: 32,
  }),

  // Creator — monthly
  metalFontOption({
    productId: 'metal_creator_monthly_300',
    tier: 'creator',
    billing: 'monthly',
    priceInCents: 699,
    credits: 300,
    generations: 12,
  }),
  metalFontOption({
    productId: 'metal_creator_monthly_1000',
    tier: 'creator',
    billing: 'monthly',
    priceInCents: 1999,
    credits: 1000,
    generations: 40,
    popular: true,
  }),
  metalFontOption({
    productId: 'metal_creator_monthly_3000',
    tier: 'creator',
    billing: 'monthly',
    priceInCents: 4999,
    credits: 3000,
    generations: 120,
  }),
];

const metalFontPricingCatalog = Object.fromEntries(
  metalFontPricingOptions.map((product) => [product.productId, product])
) as Record<string, PricingProduct>;

/**
 * Existing room-design catalog. Keys MUST match what the pricing UI sends as
 * product_id. The metal-font catalog is appended below with its own 8x
 * provider-credit multiplier and product set.
 */
export const pricingCatalog: Record<string, PricingProduct> = {
  hobby_one_time: {
    productId: 'hobby_one_time',
    productName: 'Hobby',
    planName: 'Hobby',
    description: 'One-time room design credits',
    type: PaymentType.ONE_TIME,
    priceInCents: 500,
    currency: 'usd',
    credits: creditsForPriceInCents(500),
  },
  designer_one_time: {
    productId: 'designer_one_time',
    productName: 'Designer',
    planName: 'Designer',
    description: 'One-time room design credits',
    type: PaymentType.ONE_TIME,
    priceInCents: 1500,
    currency: 'usd',
    credits: creditsForPriceInCents(1500),
  },
  studio_one_time: {
    productId: 'studio_one_time',
    productName: 'Studio',
    planName: 'Studio',
    description: 'One-time room design credits',
    type: PaymentType.ONE_TIME,
    priceInCents: 3900,
    currency: 'usd',
    credits: creditsForPriceInCents(3900),
  },
  starter_monthly: {
    productId: 'starter_monthly',
    productName: 'Starter',
    planName: 'Starter',
    description: 'Starter Monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 900,
    currency: 'usd',
    credits: creditsForPriceInCents(900),
    creditsValidDays: 31,
    plan: {
      name: 'Starter',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  pro_monthly: {
    productId: 'pro_monthly',
    productName: 'Pro',
    planName: 'Pro',
    description: 'Pro Monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 1900,
    currency: 'usd',
    credits: creditsForPriceInCents(1900),
    creditsValidDays: 31,
    plan: { name: 'Pro', interval: PaymentInterval.MONTH, intervalCount: 1 },
  },
  enterprise_monthly: {
    productId: 'enterprise_monthly',
    productName: 'Enterprise',
    planName: 'Enterprise',
    description: 'Enterprise Monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 3900,
    currency: 'usd',
    credits: creditsForPriceInCents(3900),
    creditsValidDays: 31,
    plan: {
      name: 'Enterprise',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  starter_yearly: {
    productId: 'starter_yearly',
    productName: 'Starter',
    planName: 'Starter',
    description: 'Starter Yearly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 7900,
    currency: 'usd',
    credits: creditsForPriceInCents(7900),
    creditsValidDays: 366,
    plan: { name: 'Starter', interval: PaymentInterval.YEAR, intervalCount: 1 },
  },
  pro_yearly: {
    productId: 'pro_yearly',
    productName: 'Pro',
    planName: 'Pro',
    description: 'Pro Yearly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 16900,
    currency: 'usd',
    credits: creditsForPriceInCents(16900),
    creditsValidDays: 366,
    plan: { name: 'Pro', interval: PaymentInterval.YEAR, intervalCount: 1 },
  },
  enterprise_yearly: {
    productId: 'enterprise_yearly',
    productName: 'Enterprise',
    planName: 'Enterprise',
    description: 'Enterprise Yearly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 34900,
    currency: 'usd',
    credits: creditsForPriceInCents(34900),
    creditsValidDays: 366,
    plan: {
      name: 'Enterprise',
      interval: PaymentInterval.YEAR,
      intervalCount: 1,
    },
  },
  ...metalFontPricingCatalog,
};

export function getPricingProduct(productId: string): PricingProduct | null {
  if (!productId) return null;
  return pricingCatalog[productId] ?? null;
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}
