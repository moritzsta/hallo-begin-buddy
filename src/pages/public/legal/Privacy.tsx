import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { LifestyleGradientBar } from '@/components/LifestyleGradientBar';

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <LifestyleGradientBar />
      <PublicNavbar />
      
      <section className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          {t('public.legal.privacy.title')}
        </h1>
        
        <Card className="p-8 rounded-2xl space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.privacy.sections.intro.title')}</h2>
            <p className="text-muted-foreground">
              {t('public.legal.privacy.sections.intro.text')}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.privacy.sections.controller.title')}</h2>
            <p className="text-muted-foreground">
              {'{'}{'{'} CompanyName {'}}'}{'}'}<br />
              {'{'}{'{'} Address {'}}'}{'}'}<br />
              E-Mail: {'{'}{'{'} ContactEmail {'}}'}{'}'}<br />
              {t('public.legal.privacy.sections.controller.dpo')}: {'{'}{'{'} DPO_Email {'}}'}{'}'}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.privacy.sections.purpose.title')}</h2>
            <p className="text-muted-foreground mb-3">
              {t('public.legal.privacy.sections.purpose.text')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t('public.legal.privacy.sections.purpose.item1')}</li>
              <li>{t('public.legal.privacy.sections.purpose.item2')}</li>
              <li>{t('public.legal.privacy.sections.purpose.item3')}</li>
              <li>{t('public.legal.privacy.sections.purpose.item4')}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.privacy.sections.legal.title')}</h2>
            <p className="text-muted-foreground">
              {t('public.legal.privacy.sections.legal.text')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3">
              <li>{t('public.legal.privacy.sections.legal.art6a')}</li>
              <li>{t('public.legal.privacy.sections.legal.art6b')}</li>
              <li>{t('public.legal.privacy.sections.legal.art6f')}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.privacy.sections.data.title')}</h2>
            <p className="text-muted-foreground mb-3">
              {t('public.legal.privacy.sections.data.text')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t('public.legal.privacy.sections.data.email')}</li>
              <li>{t('public.legal.privacy.sections.data.files')}</li>
              <li>{t('public.legal.privacy.sections.data.metadata')}</li>
              <li>{t('public.legal.privacy.sections.data.usage')}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.privacy.sections.storage.title')}</h2>
            <p className="text-muted-foreground">
              {t('public.legal.privacy.sections.storage.text')}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.privacy.sections.security.title')}</h2>
            <p className="text-muted-foreground mb-3">
              {t('public.legal.privacy.sections.security.text')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t('public.legal.privacy.sections.security.rls')}</li>
              <li>{t('public.legal.privacy.sections.security.signed')}</li>
              <li>{t('public.legal.privacy.sections.security.encryption')}</li>
              <li>{t('public.legal.privacy.sections.security.noThirdParty')}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.privacy.sections.rights.title')}</h2>
            <p className="text-muted-foreground mb-3">
              {t('public.legal.privacy.sections.rights.text')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t('public.legal.privacy.sections.rights.access')}</li>
              <li>{t('public.legal.privacy.sections.rights.rectification')}</li>
              <li>{t('public.legal.privacy.sections.rights.erasure')}</li>
              <li>{t('public.legal.privacy.sections.rights.restriction')}</li>
              <li>{t('public.legal.privacy.sections.rights.portability')}</li>
              <li>{t('public.legal.privacy.sections.rights.objection')}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.privacy.sections.cookies.title')}</h2>
            <p className="text-muted-foreground">
              {t('public.legal.privacy.sections.cookies.text')}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.privacy.sections.changes.title')}</h2>
            <p className="text-muted-foreground">
              {t('public.legal.privacy.sections.changes.text')}
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {t('public.legal.privacy.lastUpdated')}: {new Date().toLocaleDateString()}
            </p>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}