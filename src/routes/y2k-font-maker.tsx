import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { socialMeta } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { Y2kFontMaker } from '@/blocks/y2k-font-maker';

export const Route = createFileRoute('/y2k-font-maker')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: `${m['y2k.meta.title']({}, { locale })} | ${envConfigs.app_name}`,
      description: m['y2k.meta.description']({}, { locale }),
    };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    const title = loaderData?.title ?? m['y2k.meta.title']({}, { locale });
    const description =
      loaderData?.description ?? m['y2k.meta.description']({}, { locale });
    const urlFor = (language: (typeof locales)[number]) =>
      localizeUrl(`${envConfigs.app_url}/y2k-font-maker`, { locale: language })
        .href;
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'robots', content: 'index,follow' },
        ...socialMeta({
          title,
          description,
          url: urlFor(locale),
          locale,
          image: '/imgs/og/y2k.png',
        }),
      ],
      links: [
        { rel: 'canonical', href: urlFor(locale) },
        ...locales.map((language) => ({
          rel: 'alternate',
          hrefLang: language,
          href: urlFor(language),
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
                '@id': `${urlFor(locale)}#application`,
                name: m['y2k.name']({}, { locale }),
                url: urlFor(locale),
                description,
                inLanguage: locale,
                applicationCategory: 'DesignApplication',
                operatingSystem: 'Web browser',
                isAccessibleForFree: true,
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                image: `${envConfigs.app_url}/imgs/og/y2k.png`,
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: envConfigs.app_name,
                    item: localizeUrl(`${envConfigs.app_url}/`, { locale })
                      .href,
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: m['y2k.name']({}, { locale }),
                    item: urlFor(locale),
                  },
                ],
              },
            ],
          }).replace(/</g, '\\u003c'),
        },
      ],
    };
  },
  component: Y2kFontMaker,
});
