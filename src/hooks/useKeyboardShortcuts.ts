import { useEffect } from 'react';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutHandler[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.handler();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Predefined shortcuts for easy reuse
export const KEYBOARD_SHORTCUTS = {
  UPLOAD: { key: 'u', ctrl: true, description: 'Open upload' },
  SEARCH: { key: 'f', ctrl: true, description: 'Focus search' },
  HELP: { key: '?', ctrl: false, description: 'Show keyboard shortcuts' },
  NEW_FOLDER: { key: 'n', ctrl: true, description: 'Create new folder' },
  ESCAPE: { key: 'Escape', ctrl: false, description: 'Close dialog/modal' },
};
