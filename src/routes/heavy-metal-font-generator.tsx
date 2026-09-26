import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { faqSchema, metalFaq } from '@/lib/metal-faq';
import { socialMeta } from '@/lib/seo';
import { getLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { MetalFontStudio } from '@/blocks/metal-font-studio';

const title =
  'Heavy Metal Font Generator - Free Heavy Metal Text Maker | Metal Font Generator';
const description =
  'Free heavy metal font generator. Turn any band name into classic heavy metal lettering - spiked, chrome or vintage styles - ready to download for merch.';

export const Route = createFileRoute('/heavy-metal-font-generator')({
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    const urlFor = (loc: (typeof locales)[number]) =>
      localizeUrl(`${envConfigs.app_url}/heavy-metal-font-generator`, {
        locale: loc,
      }).href;
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'robots', content: 'index,follow' },
        ...socialMeta({ title, description, url: urlFor(locale), locale }),
      ],
      links: [
        { rel: 'canonical', href: urlFor(locale) },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
        { rel: 'alternate', hrefLang: 'x-default', href: urlFor('en') },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebApplication',
                name: 'Heavy Metal Font Generator',
                url: urlFor(locale),
                description,
                applicationCategory: 'DesignApplication',
                operatingSystem: 'Web browser',
              },
              faqSchema(metalFaq('heavy', locale)),
            ],
          }),
        },
      ],
    };
  },
  component: () => <MetalFontStudio heavy />,
});
