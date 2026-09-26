import { m } from '@/paraglide/messages.js';
import { SiteFooter } from '@/components/site-footer';

export function Footer() {
  return (
    <SiteFooter
      columns={[
        {
          title: m['metal.footer.product'](),
          links: [
            { label: m['metal.nav.studio'](), href: '/#workbench' },
            { label: m['metal.nav.materials'](), href: '/#materials' },
          ],
        },
        {
          title: m['landing.footer.col_legal'](),
          links: [
            { label: m['landing.footer.privacy'](), href: '/privacy-policy' },
            { label: m['landing.footer.terms'](), href: '/terms-of-service' },
          ],
        },
      ]}
    />
  );
}
