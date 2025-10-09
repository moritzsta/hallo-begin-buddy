import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { LifestyleGradientBar } from '@/components/LifestyleGradientBar';

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <LifestyleGradientBar />
      <PublicNavbar />
      
      <section className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          {t('public.legal.terms.title')}
        </h1>
        
        <Card className="p-8 rounded-2xl space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.terms.sections.scope.title')}</h2>
            <p className="text-muted-foreground">
              {t('public.legal.terms.sections.scope.text')}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.terms.sections.services.title')}</h2>
            <p className="text-muted-foreground mb-3">
              {t('public.legal.terms.sections.services.text')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t('public.legal.terms.sections.services.smart')}</li>
              <li>{t('public.legal.terms.sections.services.storage')}</li>
              <li>{t('public.legal.terms.sections.services.preview')}</li>
              <li>{t('public.legal.terms.sections.services.organization')}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.terms.sections.plans.title')}</h2>
            <p className="text-muted-foreground mb-3">
              {t('public.legal.terms.sections.plans.text')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Free:</strong> 30 Smart Uploads/Mon, 5 GB, 25 MB/Datei</li>
              <li><strong>Basic:</strong> 300 Smart Uploads/Mon, 50 GB, 250 MB/Datei - 3,99€/Mon</li>
              <li><strong>Plus:</strong> 1.500 Smart Uploads/Mon, 200 GB, 1 GB/Datei - 7,99€/Mon</li>
              <li><strong>Max:</strong> 5.000 Smart Uploads/Mon, 1 TB, 2 GB/Datei - 12,99€/Mon</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.terms.sections.payment.title')}</h2>
            <p className="text-muted-foreground mb-3">
              {t('public.legal.terms.sections.payment.text')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t('public.legal.terms.sections.payment.monthly')}</li>
              <li>{t('public.legal.terms.sections.payment.stripe')}</li>
              <li>{t('public.legal.terms.sections.payment.vat')}</li>
              <li>{t('public.legal.terms.sections.payment.renew')}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.terms.sections.cancellation.title')}</h2>
            <p className="text-muted-foreground">
              {t('public.legal.terms.sections.cancellation.text')}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.terms.sections.upgrade.title')}</h2>
            <p className="text-muted-foreground">
              {t('public.legal.terms.sections.upgrade.text')}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.terms.sections.userContent.title')}</h2>
            <p className="text-muted-foreground mb-3">
              {t('public.legal.terms.sections.userContent.text')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t('public.legal.terms.sections.userContent.responsible')}</li>
              <li>{t('public.legal.terms.sections.userContent.legal')}</li>
              <li>{t('public.legal.terms.sections.userContent.rights')}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.terms.sections.liability.title')}</h2>
            <p className="text-muted-foreground">
              {t('public.legal.terms.sections.liability.text')}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.terms.sections.availability.title')}</h2>
            <p className="text-muted-foreground">
              {t('public.legal.terms.sections.availability.text')}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.terms.sections.law.title')}</h2>
            <p className="text-muted-foreground">
              {t('public.legal.terms.sections.law.text')}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('public.legal.terms.sections.changes.title')}</h2>
            <p className="text-muted-foreground">
              {t('public.legal.terms.sections.changes.text')}
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {t('public.legal.terms.lastUpdated')}: {new Date().toLocaleDateString()}
            </p>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}