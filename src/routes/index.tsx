import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { socialMeta } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { MetalFontStudio } from '@/blocks/metal-font-studio';

function HomePage() {
  return <MetalFontStudio />;
}

function seoSchema(homeUrl: string, description: string, locale: string) {
  const localized = { locale: locale as any };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: m['metal.brand.name']({}, localized),
        url: homeUrl,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web browser',
        description,
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          ['metal.seo.faq.q1', 'metal.seo.faq.a1'],
          ['metal.seo.faq.q2', 'metal.seo.faq.a2'],
          ['metal.seo.faq.q3', 'metal.seo.faq.a3'],
        ].map(([question, answer]) => ({
          '@type': 'Question',
          name: m[question as 'metal.seo.faq.q1']({}, localized),
          acceptedAnswer: {
            '@type': 'Answer',
            text: m[answer as 'metal.seo.faq.a1']({}, localized),
          },
        })),
      },
    ],
  };
}

export const Route = createFileRoute('/')({
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/`, { locale: loc as any }).href;
    const title = m['common.metadata.title']({}, { locale: locale as any });
    const description = m['common.metadata.description'](
      {},
      { locale: locale as any }
    );

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
          children: JSON.stringify(
            seoSchema(urlFor(locale), description, locale)
          ),
        },
      ],
    };
  },
  component: HomePage,
});
