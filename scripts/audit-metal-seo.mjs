import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Audit raw server HTML, not a hydrated browser DOM.
const base = process.argv[2] || 'http://localhost:3002';
const messages = JSON.parse(readFileSync('messages/en.json', 'utf8'));
const baseline = JSON.parse(
  execFileSync('git', ['show', 'HEAD:messages/en.json'], { encoding: 'utf8' })
);
const decode = (value) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16))
    )
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
const plain = (html) =>
  decode(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
const attr = (tag, name) =>
  decode(tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] || '');
const tags = (html, name) =>
  [
    ...html.matchAll(
      new RegExp(`<${name}\\b[^>]*>[\\s\\S]*?<\\/${name}>`, 'gi')
    ),
  ].map(([x]) => plain(x));
const meta = (html, name) =>
  attr(
    (html.match(/<meta\b[^>]*>/g) || []).find(
      (tag) => attr(tag, 'name') === name || attr(tag, 'property') === name
    ) || '',
    'content'
  );
const canonical = (html) =>
  attr(
    (html.match(/<link\b[^>]*>/g) || []).find(
      (tag) => attr(tag, 'rel') === 'canonical'
    ) || '',
    'href'
  );
const linked = (html, path, text) =>
  [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].some(
    ([, attrs, copy]) => attr(attrs, 'href') === path && plain(copy) === text
  );
async function get(path) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, `${path} must return 200`);
  return response.text();
}
const [home, heavy, blog, sitemap] = await Promise.all(
  ['/', '/heavy-metal-font-generator', '/blog', '/sitemap.xml'].map(get)
);
assert.equal(tags(home, 'title')[0], baseline['common.metadata.title']);
assert.deepEqual(tags(home, 'h1'), [baseline['metal.hero.title']]);
const body = home.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)[1];
const text = plain(body).toLowerCase();
const words = text.match(/\b[a-z0-9]+(?:['’-][a-z0-9]+)*\b/g) || [];
const count = (text.match(/metal font generator/g) || []).length;
const density = ((count * 3) / words.length) * 100;
assert.ok(
  density < 2,
  `Homepage phrase occupancy must be <2%, found ${density}%`
);
for (const keyword of [
  'metal text generator',
  'metal lettering generator',
  'font generator metal',
  'chrome text generator',
  'metallic text generator',
  '3d metal text',
  'free metal font generator',
  'metal font generator copy and paste',
])
  assert.ok(text.includes(keyword), keyword);
assert.equal(
  tags(heavy, 'title')[0],
  'Heavy Metal Font Generator - Free Heavy Metal Text Maker | Metal Font Generator'
);
assert.deepEqual(tags(heavy, 'h1'), ['Heavy Metal Font Generator']);
assert.equal(
  meta(heavy, 'description'),
  'Free heavy metal font generator. Turn any band name into classic heavy metal lettering - spiked, chrome or vintage styles - ready to download for merch.'
);
assert.deepEqual(tags(heavy, 'h2'), [
  'What Makes Heavy Metal Lettering Different',
  'How to Make Heavy Metal Text Online',
  'Heavy vs Death vs Black Metal Lettering',
  'Heavy Metal Font Generator FAQ',
]);
assert.equal(meta(blog, 'robots'), 'noindex,follow');
assert.ok(!sitemap.includes('<loc>https://metalfontgenerator.org/blog</loc>'));
assert.ok(
  sitemap.includes(
    '<loc>https://metalfontgenerator.org/heavy-metal-font-generator</loc>'
  )
);
assert.ok(!plain(blog).includes('Room design ideas'));
for (const [kind, html, size] of [
  ['home', home, 7],
  ['heavy', heavy, 5],
]) {
  const json = [
    ...html.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
    ),
  ].map(([, data]) => JSON.parse(data));
  const faq = json
    .flatMap((item) => item['@graph'] || [item])
    .find((item) => item['@type'] === 'FAQPage');
  const visible = [
    ...html.matchAll(
      /<h4\b[^>]*>([\s\S]*?)<\/h4>\s*<p\b[^>]*>([\s\S]*?)<\/p>/g
    ),
  ].map(([, q, a]) => ({ question: plain(q), answer: plain(a) }));
  assert.equal(faq.mainEntity.length, size);
  assert.deepEqual(
    faq.mainEntity.map((item) => ({
      question: item.name,
      answer: item.acceptedAnswer.text,
    })),
    visible
  );
  const prefix = kind === 'home' ? 'metal.seo' : 'metal.heavy';
  for (const [key, value] of Object.entries(messages)) {
    if (
      key.startsWith(prefix + '.') &&
      (key.endsWith('.body') ||
        key.endsWith('.intro') ||
        key.endsWith('.comparison') ||
        key.endsWith('.workflow'))
    ) {
      assert.ok(
        plain(html).includes(value.replace(/\s+/g, ' ')),
        `SSR missing ${key}`
      );
    }
  }
}
assert.ok(
  linked(home, '/heavy-metal-font-generator', 'Heavy Metal Font Generator')
);
assert.ok(linked(heavy, '/', 'metal font generator'));
for (const [path, html] of [
  ['/', home],
  ['/heavy-metal-font-generator', heavy],
  ['/blog', blog],
  ...(await Promise.all(
    ['/privacy-policy', '/terms-of-service'].map(async (path) => [
      path,
      await get(path),
    ])
  )),
]) {
  assert.equal(tags(html, 'h1').length, 1, path);
  assert.equal(canonical(html), `https://metalfontgenerator.org${path}`, path);
  assert.equal(meta(html, 'og:site_name'), 'metalfontgenerator', path);
  assert.ok(
    plain(html).includes('© 2026 metalfontgenerator. All rights reserved.'),
    path
  );
  assert.ok(!meta(html, 'keywords'), path);
  if (path !== '/blog')
    assert.equal(meta(html, 'robots'), 'index,follow', path);
  if (path !== '/')
    assert.ok(
      linked(
        home,
        path,
        path === '/heavy-metal-font-generator'
          ? 'Heavy Metal Font Generator'
          : path === '/privacy-policy'
            ? 'Privacy policy'
            : path === '/terms-of-service'
              ? 'Terms of service'
              : 'Blog'
      ) || path === '/blog'
    );
}
console.log(
  JSON.stringify(
    {
      checks: '9/9 passed',
      scope: 'raw production HTML',
      homepageWords: words.length,
      exactPhraseCount: count,
      phraseOccupancyPercent: Number(density.toFixed(2)),
      homepageFaq: 7,
      heavyFaq: 5,
    },
    null,
    2
  )
);
