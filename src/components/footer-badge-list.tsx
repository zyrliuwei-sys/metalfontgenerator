import { getRouteApi } from '@tanstack/react-router';
import { DEFAULT_FOOTER_BADGES } from '@/features/footer-badges/defaults';
import { parseStoredFooterBadges } from '@/features/footer-badges/validation';

import { cn } from '@/lib/utils';
import { usePublicConfig } from '@/hooks/use-public-config';
import { FooterBadgeLink } from '@/components/footer-badge-link';

const rootRoute = getRouteApi('__root__');

export function FooterBadgeList({ className }: { className?: string }) {
  const { data } = usePublicConfig();
  const ssrStored = rootRoute.useLoaderData({ select: (d) => d.footerBadges });
  const stored = data ? data.footer_badges : (ssrStored ?? undefined);
  const badges =
    stored === undefined
      ? DEFAULT_FOOTER_BADGES
      : parseStoredFooterBadges(stored);

  if (badges.length === 0) return null;

  const badgeLinks = (copy: 'original' | 'duplicate') =>
    badges.map((badge, index) => (
      <FooterBadgeLink
        key={`${copy}:${badge.href}:${badge.src}:${index}`}
        badge={badge}
        hidden={copy === 'duplicate'}
        className="footer-badge-link"
      />
    ));

  return (
    <div className={cn('footer-badge-marquee', className)}>
      <div className="footer-badge-track">
        <div className="footer-badge-group">{badgeLinks('original')}</div>
        <div className="footer-badge-group" aria-hidden="true">
          {badgeLinks('duplicate')}
        </div>
      </div>
    </div>
  );
}
