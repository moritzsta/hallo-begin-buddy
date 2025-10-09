import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileText, Mail, Github, Twitter, Linkedin } from 'lucide-react';

export function PublicFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span>{t('public.nav.brand')}</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              {t('public.footer.tagline')}
            </p>
            <div className="flex gap-3">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">{t('public.footer.product')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('public.nav.pricing')}
                </Link>
              </li>
              <li>
                <Link to="/use-cases" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('public.nav.useCases')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">{t('public.footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/legal/impressum" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('public.nav.impressum')}
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('public.nav.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/legal/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('public.nav.terms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">{t('public.footer.contact')}</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <a href="mailto:contact@example.com" className="hover:text-foreground transition-colors">
                  {'{{ContactEmail}}'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {t('public.footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}