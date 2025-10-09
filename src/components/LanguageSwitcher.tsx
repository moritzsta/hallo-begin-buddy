import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { user, refreshProfile } = useAuth();

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    
    // Save to profile if user is logged in
    if (user) {
      await supabase
        .from('profiles')
        .update({ locale: lng })
        .eq('id', user.id);
      
      await refreshProfile();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('de')}>
          🇩🇪 Deutsch
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('en')}>
          🇬🇧 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
