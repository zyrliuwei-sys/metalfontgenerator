import { DEFAULT_FOOTER_BADGES } from '@/features/footer-badges/defaults';
import { parseStoredFooterBadges } from '@/features/footer-badges/validation';

import { cn } from '@/lib/utils';
import { usePublicConfig } from '@/hooks/use-public-config';

export function FooterBadgeList({ className }: { className?: string }) {
  const { data } = usePublicConfig();
  const badges =
    data?.footer_badges === undefined
      ? DEFAULT_FOOTER_BADGES
      : parseStoredFooterBadges(data.footer_badges);

  if (badges.length === 0) return null;

  const badgeLinks = (copy: 'original' | 'duplicate') =>
    badges.map((badge, index) => (
      <a
        key={`${copy}:${badge.href}:${badge.src}:${index}`}
        href={badge.href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={copy === 'duplicate' ? -1 : undefined}
        className="footer-badge-link"
      >
        <img
          src={badge.src}
          alt={copy === 'duplicate' ? '' : badge.alt}
          width={badge.width ?? 250}
          height={badge.height}
          loading="lazy"
        />
      </a>
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
