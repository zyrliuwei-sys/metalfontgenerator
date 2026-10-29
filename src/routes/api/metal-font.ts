import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { consume, getBalance, grant, revoke } from '@/modules/credits/service';
import {
  creditsForMetalFontUsage,
  generateMetalFont,
  getMetalFontHistoryItem,
  hasPaidMetalFontOrder,
  isMetalFontConfigured,
  METAL_FONT_CREDIT_RESERVE,
  METAL_FONT_MODEL,
  saveMetalFontHistory,
  type MetalFinish,
} from '@/modules/metal-font/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr, respJson } from '@/lib/resp';

const FINISHES = new Set<MetalFinish>([
  'steel',
  'copper',
  'black-chrome',
  'brushed',
]);

function numberInRange(
  value: unknown,
  min: number,
  max: number
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

async function getUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user;
}

async function settleReservedCredits(params: {
  userId: string;
  userEmail: string;
  reservationId: string;
  actualCredits: number;
}): Promise<void> {
  if (params.actualCredits === METAL_FONT_CREDIT_RESERVE) return;

  if (params.actualCredits < METAL_FONT_CREDIT_RESERVE) {
    await grant({
      userId: params.userId,
      userEmail: params.userEmail,
      credits: METAL_FONT_CREDIT_RESERVE - params.actualCredits,
      scene: 'ai_task_adjustment',
      description: 'Metal font generation credit adjustment',
    });
    return;
  }

  const extra = await consume({
    userId: params.userId,
    userEmail: params.userEmail,
    credits: params.actualCredits - METAL_FONT_CREDIT_RESERVE,
    scene: 'ai_task',
    description: 'Metal font generation usage adjustment',
  });
  if (!extra.success) {
    console.warn('could not collect metal font usage adjustment', {
      userId: params.userId,
      actualCredits: params.actualCredits,
    });
  }
}

async function POST({ request }: { request: Request }) {
  const limited = enforceMinIntervalRateLimit(request, {
    intervalMs: 5000,
    keyPrefix: 'metal-font',
  });
  if (limited) return limited;

  let reservationId: string | undefined;

  try {
    const user = await getUser(request);
    if (!user) {
      return respJson(
        -1,
        'Sign in to generate a metal font',
        {
          reason: 'sign_in_required',
        },
        { status: 401 }
      );
    }

    if (!(await hasPaidMetalFontOrder(user.id))) {
      return respJson(
        -1,
        'Purchase credits or a monthly plan before generating a metal font',
        {
          reason: 'payment_required',
        },
        { status: 402 }
      );
    }

    if (!(await isMetalFontConfigured())) {
      return respErr('EvoLink is not configured by an administrator');
    }

    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const finish = body?.finish as MetalFinish;
    const angle = body?.angle;
    const extrusion = body?.extrusion;
    const light = body?.light;
    const tracking = body?.tracking;

    if (!text || text.length > 40) {
      return respErr('Text must be between 1 and 40 characters');
    }
    if (!FINISHES.has(finish)) return respErr('Invalid metal finish');
    if (!numberInRange(angle, 0, 54)) return respErr('Invalid angle');
    if (!numberInRange(extrusion, 4, 28)) return respErr('Invalid extrusion');
    if (!numberInRange(light, 20, 100)) return respErr('Invalid light');
    if (!numberInRange(tracking, -4, 18)) return respErr('Invalid tracking');

    const reservation = await consume({
      userId: user.id,
      userEmail: user.email,
      credits: METAL_FONT_CREDIT_RESERVE,
      scene: 'ai_task',
      description: 'Metal font generation reservation',
      metadata: JSON.stringify({
        provider: 'evolink',
        model: METAL_FONT_MODEL,
      }),
    });
    if (!reservation.success || !reservation.consumedCredit?.id) {
      return respErr(
        `Insufficient credits. At least ${METAL_FONT_CREDIT_RESERVE} credits are required.`
      );
    }
    const reservedCreditId = reservation.consumedCredit.id as string;
    reservationId = reservedCreditId;

    const input = { text, finish, angle, extrusion, light, tracking };
    const result = await generateMetalFont(input);
    const chargedCredits = creditsForMetalFontUsage(result.upstreamCredits);
    await settleReservedCredits({
      userId: user.id,
      userEmail: user.email,
      reservationId: reservedCreditId,
      actualCredits: chargedCredits,
    });
    reservationId = undefined;

    let historyId: string | undefined;
    try {
      const history = await saveMetalFontHistory({
        userId: user.id,
        input,
        result,
        chargedCredits,
      });
      historyId = history.id;
    } catch (historyError) {
      console.error('save metal font history failed:', historyError);
    }

    const { upstreamCredits: _upstreamCredits, ...publicResult } = result;
    return respData({
      ...publicResult,
      chargedCredits,
      ...(historyId ? { id: historyId } : {}),
    });
  } catch (error: any) {
    if (reservationId) {
      try {
        await revoke(reservationId);
      } catch (revokeError) {
        console.error('failed to restore metal font credits', revokeError);
      }
    }
    console.error('generate metal font failed:', error);
    return respErr(error?.message || 'generate metal font failed');
  }
}

async function GET({ request }: { request: Request }) {
  try {
    const id = new URL(request.url).searchParams.get('download');
    const user = await getUser(request);
    if (id === null) {
      const [hasPaidOrder, balance] = user
        ? await Promise.all([
            hasPaidMetalFontOrder(user.id),
            getBalance(user.id),
          ])
        : [false, 0];

      return respData(
        {
          authenticated: Boolean(user),
          hasPaidOrder,
          balance,
          requiredCredits: METAL_FONT_CREDIT_RESERVE,
        },
        { headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    if (!user) return respErr('Unauthorized');

    if (!id) return respErr('Download ID is required');

    const item = await getMetalFontHistoryItem({ userId: user.id, id });
    if (!item) return respErr('Metal font not found');

    const imageUrl = new URL(item.imageUrl, request.url);
    if (!['http:', 'https:'].includes(imageUrl.protocol)) {
      return respErr('Metal font download is unavailable');
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok)
      return respErr('Metal font image is no longer available');
    const contentType =
      imageResponse.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/'))
      return respErr('Metal font image is invalid');

    return new Response(imageResponse.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="metal-font-${item.id}.jpg"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('download metal font failed:', error);
    return respErr(error?.message || 'download metal font failed');
  }
}

export const Route = createFileRoute('/api/metal-font')({
  server: {
    handlers: { GET, POST },
  },
});
