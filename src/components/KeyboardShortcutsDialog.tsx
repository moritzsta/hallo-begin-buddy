import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard, Upload, Search, FolderPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsDialog = ({ open, onOpenChange }: KeyboardShortcutsDialogProps) => {
  const { t } = useTranslation();

  const shortcuts = [
    {
      keys: ['Ctrl', 'U'],
      icon: Upload,
      description: t('shortcuts.upload', { defaultValue: 'Upload-Tab öffnen' }),
    },
    {
      keys: ['Ctrl', 'F'],
      icon: Search,
      description: t('shortcuts.search', { defaultValue: 'Suche fokussieren' }),
    },
    {
      keys: ['Ctrl', 'N'],
      icon: FolderPlus,
      description: t('shortcuts.newFolder', { defaultValue: 'Neuer Ordner' }),
    },
    {
      keys: ['?'],
      icon: Keyboard,
      description: t('shortcuts.showHelp', { defaultValue: 'Diese Hilfe anzeigen' }),
    },
    {
      keys: ['Esc'],
      icon: null,
      description: t('shortcuts.close', { defaultValue: 'Dialog schließen' }),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t('shortcuts.title', { defaultValue: 'Tastenkombinationen' })}
          </DialogTitle>
          <DialogDescription>
            {t('shortcuts.description', { 
              defaultValue: 'Nutzen Sie diese Shortcuts für schnelleres Arbeiten' 
            })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {shortcuts.map((shortcut, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                {shortcut.icon && (
                  <shortcut.icon className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">{shortcut.description}</span>
              </div>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <Badge 
                    key={keyIndex} 
                    variant="outline" 
                    className="font-mono text-xs px-2 py-0.5"
                  >
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            {t('shortcuts.tip', { 
              defaultValue: 'Tipp: Drücken Sie ? um diese Übersicht jederzeit anzuzeigen' 
            })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
