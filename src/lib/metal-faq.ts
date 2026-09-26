import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';

// The visible FAQ and structured data deliberately read the same source.
export function metalFaq(kind: 'home' | 'heavy', locale = getLocale()) {
  const entries =
    kind === 'home'
      ? [
          [m['metal.seo.faq.q1'], m['metal.seo.faq.a1']],
          [m['metal.seo.faq.q2'], m['metal.seo.faq.a2']],
          [m['metal.seo.faq.q3'], m['metal.seo.faq.a3']],
          [m['metal.seo.faq.q4'], m['metal.seo.faq.a4']],
          [m['metal.seo.faq.q5'], m['metal.seo.faq.a5']],
          [m['metal.seo.faq.q6'], m['metal.seo.faq.a6']],
          [m['metal.seo.faq.q7'], m['metal.seo.faq.a7']],
        ]
      : [
          [m['metal.heavy.faq.q1'], m['metal.heavy.faq.a1']],
          [m['metal.heavy.faq.q2'], m['metal.heavy.faq.a2']],
          [m['metal.heavy.faq.q3'], m['metal.heavy.faq.a3']],
          [m['metal.heavy.faq.q4'], m['metal.heavy.faq.a4']],
          [m['metal.heavy.faq.q5'], m['metal.heavy.faq.a5']],
        ];
  return entries.map(([question, answer]) => ({
    question: question({}, { locale }),
    answer: answer({}, { locale }),
  }));
}

export function faqSchema(items: ReturnType<typeof metalFaq>) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}
