import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { LifestyleGradientBar } from '@/components/LifestyleGradientBar';

export default function Impressum() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <LifestyleGradientBar />
      <PublicNavbar />
      
      <section className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          {t('public.legal.impressum.title')}
        </h1>
        
        <Card className="p-8 rounded-2xl space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">{t('public.legal.impressum.provider')}</h2>
            <p className="text-muted-foreground">
              {'{'}{'{'} CompanyName {'}}'}{'}'}<br />
              {'{'}{'{'} Address {'}}'}{'}'}<br />
              {'{'}{'{'} ZIP {'}'}{'}'}  {'{'}{'{'} City {'}}'}{'}'}<br />
              {'{'}{'{'} Country {'}}'}{'}'}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">{t('public.legal.impressum.contact')}</h2>
            <p className="text-muted-foreground">
              E-Mail: {'{'}{'{'} ContactEmail {'}}'}{'}'}<br />
              {t('public.legal.impressum.phone')}: {'{'}{'{'} Phone {'}}'}{'}'}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">{t('public.legal.impressum.representative')}</h2>
            <p className="text-muted-foreground">
              {'{'}{'{'} RepresentativeName {'}}'}{'}'}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">{t('public.legal.impressum.vatId')}</h2>
            <p className="text-muted-foreground">
              {'{'}{'{'} VAT_ID {'}}'}{'}'}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">{t('public.legal.impressum.register')}</h2>
            <p className="text-muted-foreground">
              {'{'}{'{'} RegisterType {'}}'}{'}'}: {'{'}{'{'} RegisterNumber {'}}'}{'}'}
            </p>
          </div>

          <div className="pt-4 border-t">
            <h2 className="text-xl font-semibold mb-3">{t('public.legal.impressum.responsible')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('public.legal.impressum.responsibleText')}
            </p>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}