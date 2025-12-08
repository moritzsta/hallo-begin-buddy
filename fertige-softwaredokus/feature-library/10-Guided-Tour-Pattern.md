# 10-Guided-Tour-Pattern

## Überblick

**Was:** Interaktive Onboarding-Tour mit Step-by-Step-Führung, Spotlight-Effekt und persistiertem Fortschritt.

**Wann verwenden:**
- Für Onboarding neuer Nutzer
- Zur Einführung neuer Features
- Wenn wichtige UI-Elemente erklärt werden sollen

**Komplexität:** Mittel

---

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                     Guided Tour System                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │           GuidedTourContext.tsx          │               │
│  │  - currentStep, totalSteps               │               │
│  │  - hasSeenTour (localStorage)            │               │
│  │  - startTour(), nextStep(), skipTour()   │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           ├──────────────────┬──────────────────┐          │
│           ▼                  ▼                  ▼          │
│  ┌─────────────┐    ┌─────────────────┐   ┌─────────────┐  │
│  │TourTooltip  │    │  TourBackdrop   │   │TourProgress │  │
│  │(positioned) │    │  (Spotlight)    │   │  (Dots)     │  │
│  └─────────────┘    └─────────────────┘   └─────────────┘  │
│           ▲                                                 │
│           │                                                 │
│  ┌─────────────────────────────────────────┐               │
│  │            tourSteps.ts                  │               │
│  │  - Step-Konfiguration mit Selektoren    │               │
│  │  - data-tour Attribute Mapping          │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementierung

### Schritt 1: Tour Steps Konfiguration

```typescript
// src/config/tourSteps.ts
export interface TourStep {
  id: string;
  selector: string;          // CSS-Selektor für data-tour Attribut
  titleKey: string;          // i18n Key für Titel
  descriptionKey: string;    // i18n Key für Beschreibung
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  requiredPath?: string;     // Optional: Nur auf dieser Route anzeigen
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    selector: '[data-tour="sidebar"]',
    titleKey: 'tour.step1.title',
    descriptionKey: 'tour.step1.desc',
    position: 'right'
  },
  {
    id: 'create-prompt',
    selector: '[data-tour="create-button"]',
    titleKey: 'tour.step2.title',
    descriptionKey: 'tour.step2.desc',
    position: 'bottom'
  },
  {
    id: 'folders',
    selector: '[data-tour="folder-tree"]',
    titleKey: 'tour.step3.title',
    descriptionKey: 'tour.step3.desc',
    position: 'right'
  },
  {
    id: 'search',
    selector: '[data-tour="search-bar"]',
    titleKey: 'tour.step4.title',
    descriptionKey: 'tour.step4.desc',
    position: 'bottom'
  },
  {
    id: 'ai-features',
    selector: '[data-tour="ai-analyze"]',
    titleKey: 'tour.step5.title',
    descriptionKey: 'tour.step5.desc',
    position: 'left'
  },
  {
    id: 'profile-menu',
    selector: '[data-tour="profile-menu"]',
    titleKey: 'tour.step6.title',
    descriptionKey: 'tour.step6.desc',
    position: 'left'
  }
];
```

### Schritt 2: Guided Tour Context

```typescript
// src/contexts/GuidedTourContext.tsx
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { tourSteps } from '@/config/tourSteps';

interface TourState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  hasSeenTour: boolean;
  lastCompletedStep: number;
  isDismissed: boolean;
  showWelcome: boolean;
}

interface TourContextValue {
  state: TourState;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  closeTour: () => void;
  resetTour: () => void;
  setStep: (step: number) => void;
}

const GuidedTourContext = createContext<TourContextValue | undefined>(undefined);

const STORAGE_KEY = 'guidedTour';

export const GuidedTourProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  
  const getInitialState = (): TourState => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        return {
          isActive: false,
          currentStep: data.currentStep || 0,
          totalSteps: tourSteps.length,
          hasSeenTour: data.seen || false,
          lastCompletedStep: data.lastCompletedStep || -1,
          isDismissed: data.dismissed || false,
          showWelcome: !data.seen && !data.dismissed
        };
      }
    } catch (e) {
      console.error('[Tour] Failed to load state:', e);
    }
    
    return {
      isActive: false,
      currentStep: 0,
      totalSteps: tourSteps.length,
      hasSeenTour: false,
      lastCompletedStep: -1,
      isDismissed: false,
      showWelcome: true
    };
  };

  const [state, setState] = useState<TourState>(getInitialState);

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        seen: state.hasSeenTour,
        currentStep: state.currentStep,
        lastCompletedStep: state.lastCompletedStep,
        dismissed: state.isDismissed,
        lastUpdate: new Date().toISOString(),
        lastRoute: location.pathname
      }));
    } catch (e) {
      console.error('[Tour] Failed to save state:', e);
    }
  }, [state, location.pathname]);

  const startTour = () => {
    setState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      showWelcome: false,
      hasSeenTour: false,
      isDismissed: false
    }));
  };

  const nextStep = () => {
    setState(prev => {
      const nextStepIndex = prev.currentStep + 1;
      
      if (nextStepIndex >= prev.totalSteps) {
        // Tour completed
        return {
          ...prev,
          isActive: false,
          hasSeenTour: true,
          lastCompletedStep: prev.totalSteps - 1,
          currentStep: 0
        };
      }
      
      return {
        ...prev,
        currentStep: nextStepIndex,
        lastCompletedStep: Math.max(prev.lastCompletedStep, nextStepIndex - 1)
      };
    });
  };

  const prevStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1)
    }));
  };

  const skipTour = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      isDismissed: true,
      showWelcome: false,
      hasSeenTour: true
    }));
  };

  const closeTour = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      hasSeenTour: true,
      lastCompletedStep: Math.max(prev.lastCompletedStep, prev.currentStep)
    }));
  };

  const resetTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      isActive: false,
      currentStep: 0,
      totalSteps: tourSteps.length,
      hasSeenTour: false,
      lastCompletedStep: -1,
      isDismissed: false,
      showWelcome: true
    });
  };

  const setStep = (step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, Math.min(step, prev.totalSteps - 1))
    }));
  };

  const value = useMemo(() => ({
    state,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    closeTour,
    resetTour,
    setStep
  }), [state]);

  return (
    <GuidedTourContext.Provider value={value}>
      {children}
    </GuidedTourContext.Provider>
  );
};

export const useGuidedTour = () => {
  const context = useContext(GuidedTourContext);
  if (!context) {
    throw new Error('useGuidedTour must be used within GuidedTourProvider');
  }
  return context;
};
```

### Schritt 3: Tour Tooltip Komponente

```typescript
// src/components/tour/TourTooltip.tsx
import { useEffect, useState, useCallback } from 'react';
import { useGuidedTour } from '@/contexts/GuidedTourContext';
import { tourSteps } from '@/config/tourSteps';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export const TourTooltip = () => {
  const { state, nextStep, prevStep, skipTour } = useGuidedTour();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  const currentStep = tourSteps[state.currentStep];

  const calculatePosition = useCallback(() => {
    if (!currentStep) return;

    const element = document.querySelector(currentStep.selector);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const margin = 12;

    let top = 0;
    let left = 0;
    let finalPosition = currentStep.position || 'auto';

    if (finalPosition === 'auto') {
      // Auto-detect best position
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;

      if (spaceBelow >= tooltipHeight + margin) {
        finalPosition = 'bottom';
      } else if (spaceAbove >= tooltipHeight + margin) {
        finalPosition = 'top';
      } else if (spaceRight >= tooltipWidth + margin) {
        finalPosition = 'right';
      } else {
        finalPosition = 'left';
      }
    }

    switch (finalPosition) {
      case 'top':
        top = rect.top - tooltipHeight - margin;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - margin;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + margin;
        break;
    }

    // Keep tooltip in viewport
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));

    setPosition({ top, left });
    setTooltipPosition(finalPosition as 'top' | 'bottom' | 'left' | 'right');
  }, [currentStep]);

  useEffect(() => {
    if (state.isActive) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition);
    }

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [state.isActive, state.currentStep, calculatePosition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.isActive) return;
      
      if (e.key === 'Escape') {
        skipTour();
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        nextStep();
      } else if (e.key === 'ArrowLeft' && state.currentStep > 0) {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isActive, state.currentStep, nextStep, prevStep, skipTour]);

  if (!state.isActive || !currentStep) return null;

  return (
    <div
      className="fixed z-[9999] w-80 bg-popover text-popover-foreground rounded-lg shadow-2xl border p-4"
      style={{ top: position.top, left: position.left }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={skipTour}
      >
        <X className="h-4 w-4" />
      </Button>

      <h3 className="font-semibold text-lg mb-2">
        {/* Use translation key */}
        Step {state.currentStep + 1} Title
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        {/* Use translation key */}
        Step description goes here
      </p>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: state.totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === state.currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {state.currentStep > 0 && (
            <Button variant="outline" size="sm" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" onClick={nextStep}>
            {state.currentStep === state.totalSteps - 1 ? 'Fertig' : 'Weiter'}
            {state.currentStep < state.totalSteps - 1 && (
              <ChevronRight className="h-4 w-4 ml-1" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
```

### Schritt 4: Tour Backdrop (Spotlight-Effekt)

```typescript
// src/components/tour/TourBackdrop.tsx
import { useEffect, useState } from 'react';
import { useGuidedTour } from '@/contexts/GuidedTourContext';
import { tourSteps } from '@/config/tourSteps';

export const TourBackdrop = () => {
  const { state } = useGuidedTour();
  const [spotlight, setSpotlight] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const currentStep = tourSteps[state.currentStep];

  useEffect(() => {
    if (!state.isActive || !currentStep) return;

    const element = document.querySelector(currentStep.selector);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const padding = 8;

    setSpotlight({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    });
  }, [state.isActive, state.currentStep, currentStep]);

  if (!state.isActive) return null;

  return (
    <div className="fixed inset-0 z-[9998]">
      {/* Semi-transparent overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={spotlight.left}
              y={spotlight.top}
              width={spotlight.width}
              height={spotlight.height}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
        />
      </svg>
    </div>
  );
};
```

### Schritt 5: data-tour Attribute in Komponenten

```tsx
// In beliebigen Komponenten data-tour Attribute hinzufügen:

// Sidebar.tsx
<aside data-tour="sidebar" className="...">
  ...
</aside>

// CreateButton.tsx
<Button data-tour="create-button" onClick={handleCreate}>
  Neuer Prompt
</Button>

// SearchBar.tsx
<Input data-tour="search-bar" placeholder="Suchen..." />
```

---

## Best Practices

1. **Selektor-Stabilität:** `data-tour` Attribute sind stabiler als CSS-Klassen
2. **Kurze Steps:** Max. 6-8 Schritte für optimale Completion Rate
3. **Position Auto:** Automatische Positionierung als Fallback nutzen
4. **Keyboard-Support:** Escape zum Schließen, Enter/Pfeiltasten zur Navigation
5. **Persistenz:** Tour-Status in localStorage speichern
6. **Reset-Option:** In Profil-Einstellungen Tour zurücksetzen ermöglichen

---

## Checkliste

- [ ] TourSteps konfiguriert
- [ ] GuidedTourContext erstellt
- [ ] TourTooltip mit dynamischer Positionierung
- [ ] TourBackdrop mit Spotlight-Effekt
- [ ] data-tour Attribute in Komponenten
- [ ] Keyboard-Navigation implementiert
- [ ] Tour-Reset in Einstellungen
- [ ] Übersetzungen für alle Steps

---

## Querverweise

- **16-i18n-Pattern:** Mehrsprachige Tour-Texte
- **06-UI-UX-Pattern:** Tooltip-Design und Animationen

---

**Version:** 1.0  
**Stand:** 2025-01-16  
**Basis:** AllMyPrompts PromptManager
