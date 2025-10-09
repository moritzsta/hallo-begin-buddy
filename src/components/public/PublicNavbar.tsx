import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Menu, X, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PublicNavbar() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:inline">{t('public.nav.brand')}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              {t('public.nav.home')}
            </Link>
            <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
              {t('public.nav.pricing')}
            </Link>
            <Link to="/use-cases" className="text-sm font-medium hover:text-primary transition-colors">
              {t('public.nav.useCases')}
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="text-sm font-medium hover:text-primary transition-colors">
                {t('public.nav.legal')}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/legal/impressum">{t('public.nav.impressum')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/legal/privacy">{t('public.nav.privacy')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/legal/terms">{t('public.nav.terms')}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Button variant="lifestyle" className="rounded-xl" asChild>
              <Link to="/auth">{t('public.nav.cta')}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t">
            <Link 
              to="/" 
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('public.nav.home')}
            </Link>
            <Link 
              to="/pricing" 
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('public.nav.pricing')}
            </Link>
            <Link 
              to="/use-cases" 
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('public.nav.useCases')}
            </Link>
            <div className="py-2 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('public.nav.legal')}</p>
              <Link 
                to="/legal/impressum" 
                className="block pl-4 py-1 text-sm hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('public.nav.impressum')}
              </Link>
              <Link 
                to="/legal/privacy" 
                className="block pl-4 py-1 text-sm hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('public.nav.privacy')}
              </Link>
              <Link 
                to="/legal/terms" 
                className="block pl-4 py-1 text-sm hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('public.nav.terms')}
              </Link>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <ThemeSwitcher />
              <LanguageSwitcher />
              <Button variant="lifestyle" className="rounded-xl flex-1" asChild>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  {t('public.nav.cta')}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}