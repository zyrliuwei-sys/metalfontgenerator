import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import { aiTask, order, type AiTask } from '@/config/db/schema';
import { getAllConfigs, type ConfigMap } from '@/modules/config/service';
import { getStorage } from '@/modules/storage/service';
import { getUuid } from '@/lib/hash';

export const METAL_FONT_MODEL = 'gemini-nano-banana-2.1';
export const METAL_FONT_QUALITY = '2K' as const;
export const METAL_FONT_CREDIT_MULTIPLIER = 8;
export const METAL_FONT_UPSTREAM_2K_CREDITS = 3.0845;
export const METAL_FONT_CREDIT_RESERVE = Math.ceil(
  METAL_FONT_UPSTREAM_2K_CREDITS * METAL_FONT_CREDIT_MULTIPLIER
);
export const METAL_FONT_SCENE = 'metal_font';

export const METAL_FINISHES = [
  'steel',
  'copper',
  'black-chrome',
  'brushed',
] as const;

export type MetalFinish = (typeof METAL_FINISHES)[number];

export interface MetalFontResult {
  imageUrl: string;
  provider: string;
  model: string;
  upstreamCredits?: number;
}

export interface MetalFontHistoryItem extends MetalFontResult {
  id: string;
  text: string;
  finish: MetalFinish;
  angle: number;
  extrusion: number;
  light: number;
  tracking: number;
  createdAt: string;
}

interface EvoLinkTask {
  id?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | string;
  results?: string[];
  result_data?: Array<{ url?: string }>;
  error?: { message?: string; code?: string } | null;
  usage?: {
    credits_used?: number;
    credits_reserved?: number;
    total_credits?: number;
    cost?: { credits?: number };
  };
}

const EVOLINK_DEFAULT_BASE_URL = 'https://api.evolink.ai';
const METAL_FONT_HISTORY_MEDIA_TYPE = 'image';

function resolveEvoLinkConfig(
  configs: ConfigMap
): { apiKey: string; baseUrl: string } | undefined {
  const apiKey = configs.evolink_api_key?.trim();
  if (!apiKey) return undefined;

  const rawBaseUrl = (
    configs.evolink_base_url || EVOLINK_DEFAULT_BASE_URL
  ).trim();
  try {
    const baseUrl = new URL(rawBaseUrl);
    if (
      baseUrl.hostname === 'evolink.ai' ||
      baseUrl.hostname === 'www.evolink.ai'
    ) {
      baseUrl.hostname = 'api.evolink.ai';
      baseUrl.pathname = '';
      baseUrl.search = '';
      baseUrl.hash = '';
    }
    return {
      apiKey,
      baseUrl: baseUrl.toString().replace(/\/+$/, '').replace(/\/v1$/, ''),
    };
  } catch {
    return { apiKey, baseUrl: EVOLINK_DEFAULT_BASE_URL };
  }
}

export async function isMetalFontConfigured(): Promise<boolean> {
  return Boolean(resolveEvoLinkConfig(await getAllConfigs()));
}

/** Gift credits and unpaid checkouts do not unlock image generation. */
export async function hasPaidMetalFontOrder(userId: string): Promise<boolean> {
  const [paidOrder] = await db()
    .select({ id: order.id })
    .from(order)
    .where(
      and(
        eq(order.userId, userId),
        eq(order.status, 'paid'),
        gt(order.paymentAmount, 0),
        isNull(order.deletedAt)
      )
    )
    .limit(1);

  return Boolean(paidOrder);
}

function finishLabel(finish: MetalFinish): string {
  return {
    steel: 'polished silver steel',
    copper: 'warm annealed copper',
    'black-chrome': 'dark black chrome',
    brushed: 'brushed gunmetal alloy',
  }[finish];
}

export function buildMetalFontPrompt(params: {
  text: string;
  finish: MetalFinish;
  angle: number;
  extrusion: number;
  light: number;
  tracking: number;
}): string {
  const text = params.text.trim().replace(/[\r\n]+/g, ' ');
  return [
    `Create a premium heavy-metal lettering artwork featuring exactly the text "${text}".`,
    'The text must be large, centered, sharply legible, spelled exactly as provided, and rendered as the only words in the image.',
    `Use ${finishLabel(params.finish)} with dimensional 3D extrusion, realistic bevels, crisp highlights and deep material reflections.`,
    `Use a ${params.angle}-degree three-dimensional viewing angle, approximately ${params.extrusion}px of visual extrusion, ${params.light}% key light intensity, and ${params.tracking}px letter spacing as visual guidance.`,
    'Use a wide 16:9 composition on a clean dark charcoal studio background with generous margins. No people, objects, symbols, logos, decorative text, or extra letters.',
    'Make the result look like finished album-cover title lettering: bold, dramatic, highly detailed, premium, and ready to download.',
  ].join(' ');
}

async function uploadOutput(
  body: Buffer,
  contentType: string
): Promise<string> {
  const extension = contentType.split('/')[1]?.split(';')[0] || 'png';
  const name = `${getUuid()}.${extension}`;
  const storage = await getStorage();

  if (storage) {
    const result = await storage.uploadFile({
      body: new Uint8Array(body),
      key: `metal-font/${name}`,
      contentType,
      disposition: 'inline',
    });
    if (result.success && result.url) return result.url;
    throw new Error(result.error || 'upload metal font result failed');
  }

  const directory = path.join(process.cwd(), 'public', 'uploads', 'metal-font');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), body);
  return `/uploads/metal-font/${name}`;
}

async function requestEvoLink<T>(
  baseUrl: string,
  apiKey: string,
  endpoint: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers || {}),
    },
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        `EvoLink request failed (${response.status})`
    );
  }
  return data as T;
}

function getResultUrl(task: EvoLinkTask): string | undefined {
  const resultUrl = task.results?.find(
    (url): url is string => typeof url === 'string' && /^https?:\/\//.test(url)
  );
  if (resultUrl) return resultUrl;

  return task.result_data?.find(
    (item): item is { url: string } =>
      typeof item?.url === 'string' && /^https?:\/\//.test(item.url)
  )?.url;
}

function getUpstreamCredits(task: EvoLinkTask): number | undefined {
  const credits =
    task.usage?.credits_used ??
    task.usage?.cost?.credits ??
    task.usage?.total_credits ??
    task.usage?.credits_reserved;
  return typeof credits === 'number' && Number.isFinite(credits)
    ? credits
    : undefined;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function generateWithEvoLink(params: {
  prompt: string;
  apiKey: string;
  baseUrl: string;
}): Promise<{ imageUrl: string; upstreamCredits?: number }> {
  const task = await requestEvoLink<EvoLinkTask>(
    params.baseUrl,
    params.apiKey,
    '/v1/images/generations',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: METAL_FONT_MODEL,
        prompt: params.prompt,
        size: '16:9',
        quality: METAL_FONT_QUALITY,
        model_params: { thinking_level: 'medium' },
      }),
    }
  );

  if (!task.id) throw new Error('EvoLink did not return a task ID');

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (attempt > 0) await wait(2000);

    const status =
      attempt === 0
        ? task
        : await requestEvoLink<EvoLinkTask>(
            params.baseUrl,
            params.apiKey,
            `/v1/tasks/${encodeURIComponent(task.id)}`
          );

    if (status.status === 'completed') {
      const imageUrl = getResultUrl(status);
      if (!imageUrl) throw new Error('EvoLink completed without an image');
      return { imageUrl, upstreamCredits: getUpstreamCredits(status) };
    }

    if (status.status === 'failed') {
      throw new Error(
        status.error?.message || 'EvoLink image generation failed'
      );
    }
  }

  throw new Error('EvoLink image generation timed out');
}

async function persistResult(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`download failed (${response.status})`);
    const body = Buffer.from(await response.arrayBuffer());
    return await uploadOutput(
      body,
      response.headers.get('content-type') || 'image/jpeg'
    );
  } catch (error) {
    console.warn(
      'failed to persist metal font result, using remote URL:',
      error
    );
    return imageUrl;
  }
}

export async function generateMetalFont(params: {
  text: string;
  finish: MetalFinish;
  angle: number;
  extrusion: number;
  light: number;
  tracking: number;
}): Promise<MetalFontResult> {
  const config = resolveEvoLinkConfig(await getAllConfigs());
  if (!config) throw new Error('EvoLink is not configured by an administrator');

  const task = await generateWithEvoLink({
    prompt: buildMetalFontPrompt(params),
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  });

  return {
    imageUrl: await persistResult(task.imageUrl),
    provider: `evolink:${METAL_FONT_MODEL}`,
    model: METAL_FONT_MODEL,
    upstreamCredits: task.upstreamCredits,
  };
}

function parseHistoryItem(task: AiTask): MetalFontHistoryItem | undefined {
  if (!task.taskResult || !task.options) return undefined;

  try {
    const result = JSON.parse(task.taskResult) as Partial<MetalFontResult>;
    const options = JSON.parse(task.options) as Partial<MetalFontHistoryItem>;
    if (
      typeof result.imageUrl !== 'string' ||
      typeof options.text !== 'string' ||
      !METAL_FINISHES.includes(options.finish as MetalFinish)
    ) {
      return undefined;
    }

    return {
      id: task.id,
      imageUrl: result.imageUrl,
      provider: result.provider || task.provider,
      model: result.model || task.model,
      text: options.text,
      finish: options.finish as MetalFinish,
      angle: Number(options.angle) || 0,
      extrusion: Number(options.extrusion) || 0,
      light: Number(options.light) || 0,
      tracking: Number(options.tracking) || 0,
      createdAt: task.createdAt.toISOString(),
    };
  } catch {
    return undefined;
  }
}

export async function saveMetalFontHistory(params: {
  userId: string;
  input: {
    text: string;
    finish: MetalFinish;
    angle: number;
    extrusion: number;
    light: number;
    tracking: number;
  };
  result: MetalFontResult;
  chargedCredits: number;
  taskId?: string;
}): Promise<MetalFontHistoryItem> {
  const [task] = await db()
    .insert(aiTask)
    .values({
      id: getUuid(),
      userId: params.userId,
      mediaType: METAL_FONT_HISTORY_MEDIA_TYPE,
      provider: params.result.provider,
      model: params.result.model,
      prompt: buildMetalFontPrompt(params.input),
      options: JSON.stringify(params.input),
      status: 'success',
      taskId: params.taskId,
      taskResult: JSON.stringify({
        imageUrl: params.result.imageUrl,
        provider: params.result.provider,
        model: params.result.model,
      }),
      costCredits: params.chargedCredits,
      scene: METAL_FONT_SCENE,
    })
    .returning();

  const item = parseHistoryItem(task);
  if (!item) throw new Error('Saved metal font history is invalid');
  return item;
}

export async function getMetalFontHistoryItem(params: {
  userId: string;
  id: string;
}): Promise<MetalFontHistoryItem | undefined> {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, params.id),
        eq(aiTask.userId, params.userId),
        eq(aiTask.scene, METAL_FONT_SCENE),
        isNull(aiTask.deletedAt)
      )
    )
    .orderBy(desc(aiTask.createdAt))
    .limit(1);

  return task ? parseHistoryItem(task) : undefined;
}

export function creditsForMetalFontUsage(upstreamCredits?: number): number {
  if (!upstreamCredits || !Number.isFinite(upstreamCredits)) {
    return METAL_FONT_CREDIT_RESERVE;
  }
  return Math.max(1, Math.ceil(upstreamCredits * METAL_FONT_CREDIT_MULTIPLIER));
}
