# IMPROVEMENT_PROMPTS_SMART_UPLOAD.md
**Projekt:** Smart Upload & Dokumentenverwaltung  
**Ziel:** Verbesserung der Benutzerfreundlichkeit, Steuerung und KI-Interaktion  
**Status:** Umsetzungsanleitung für bestehendes System  
**Version:** 1.1  
**Datum:** 2025-10-22  

---

## 🧩 **Thema 1 – Dynamische Pfadanpassung beim Smart Upload**

**Ziel:**  
Der vorgeschlagene Ablagepfad soll dynamisch und vollständig anpassbar sein, damit der User den gesamten Pfad direkt bearbeiten und neue Ebenen intuitiv hinzufügen kann.

**Kontext:**  
- Bestehende Komponente: `src/components/upload/MetadataConfirmDialog.tsx`
- Aktuell: Pfad wird als Array von Elementen dargestellt mit einem einzigen "+"-Button am Ende
- Zu ändern: Flexibles Einfügen/Löschen von Ebenen an beliebiger Stelle

**Schritte:**  
1. Analysiere `MetadataConfirmDialog.tsx` und identifiziere die `renderPathPreview()` Funktion
2. Entferne den einzelnen "+"-Button am Ende des Pfades
3. Füge nach jedem "/" einen kleinen "+"-Button ein (IconButton mit `Plus` Icon)
4. Implementiere `handleInsertPathElement(index)` Funktion, die ein neues Eingabefeld an Position `index` einfügt
5. Passe `handleRemovePathElement(index)` an, um Elemente an beliebiger Position zu entfernen
6. Stelle sicher, dass die Pfad-Elemente als interaktive Chips mit Edit/Delete-Funktionalität dargestellt werden
7. Validiere den kompletten Pfad beim Speichern (keine leeren Segmente, keine doppelten Slashes)

**Technische Details:**  
```typescript
// Beispiel-Struktur für pathElements State
const [pathElements, setPathElements] = useState<string[]>([]);

// Insert-Funktion
const handleInsertPathElement = (index: number) => {
  const newElements = [...pathElements];
  newElements.splice(index + 1, 0, '');
  setPathElements(newElements);
};
```

**Zielergebnis:**  
Ein flexibles, intuitives Pfadbearbeitungssystem, das wie ein interaktiver Breadcrumb funktioniert – klar, logisch, direkt im Uploadprozess.

---

## 🧩 **Thema 2 – Optionales Dropdown für Dokumententypen (mit kontextueller KI-Logik)**

**Ziel:**  
Vor dem Upload soll der User optional einen Dokumententyp oder Dateikategorie aus einem Dropdown auswählen können, um der KI den passenden Kontext zu liefern.

**Kontext:**  
- Bestehende Komponente: `src/components/upload/FileUpload.tsx`
- Edge Function: `supabase/functions/smart-upload/index.ts`
- Zu erweitern: Upload-UI und KI-Prompt mit Dokumententyp-Kontext

**Schritte:**  
1. Erweitere `FileUpload.tsx` um ein Dropdown-Feld oberhalb des Upload-Bereichs
2. Definiere Dokumententypen in `src/lib/documentTypes.ts`:
   ```typescript
   export const DOCUMENT_TYPES = {
     insurance: { label_de: 'Versicherung', label_en: 'Insurance', context: '...' },
     contract: { label_de: 'Vertrag', label_en: 'Contract', context: '...' },
     invoice: { label_de: 'Rechnung', label_en: 'Invoice', context: '...' },
     tax: { label_de: 'Steuer', label_en: 'Tax', context: '...' },
     id_document: { label_de: 'Ausweis', label_en: 'ID Document', context: '...' },
     bank_statement: { label_de: 'Kontoauszug', label_en: 'Bank Statement', context: '...' },
     quote: { label_de: 'Angebot', label_en: 'Quote', context: '...' },
     photo: { label_de: 'Foto', label_en: 'Photo', context: '...' },
     graphic: { label_de: 'Grafik', label_en: 'Graphic', context: '...' },
     other: { label_de: 'Sonstiges', label_en: 'Other', context: '...' }
   };
   ```
3. Füge State für ausgewählten Dokumententyp zu `FileUpload` hinzu
4. Übergebe den gewählten Dokumententyp an `triggerSmartUpload()` und weiter an die Edge Function
5. Erweitere `supabase/functions/smart-upload/index.ts`:
   - Empfange `document_type_hint` Parameter
   - Füge spezifischen Kontext zum KI-Prompt hinzu basierend auf Dokumententyp
   - Erweitere Prompt-Instruktionen für typ-spezifische Ordnerstrukturen und Namenskonventionen
6. Implementiere i18n für Dropdown-Labels in `de.json` und `en.json`
7. Dokumententyp bleibt optional (keine Pflichtauswahl)

**Zielergebnis:**  
Ein kontextsensitiver Uploadprozess, der für jeden Dokumententyp automatisch passende Ordner-, Datums- und Benennungsstrukturen erzeugt.

---

## 🧩 **Thema 3 – Standardverhalten & Sicherheitsabfrage für KI-Analysen**

**Ziel:**  
Der User soll frei wählen können, ob Smart KI Upload standardmäßig aktiv oder deaktiviert ist. Vor jedem Upload mit KI muss eine bewusste Bestätigung erfolgen.

**Kontext:**  
- Settings-Seite: `src/pages/Settings.tsx`
- Upload-Komponente: `src/components/upload/FileUpload.tsx`
- Neue Tabelle: `user_preferences` mit `smart_upload_enabled` und `show_ai_confirmation` Feldern

**Schritte:**  
1. **Datenbank-Migration:** Erstelle `user_preferences` Tabelle:
   ```sql
   CREATE TABLE user_preferences (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
     smart_upload_enabled BOOLEAN DEFAULT false,
     show_ai_confirmation BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   -- RLS Policies für owner-only access
   ```
2. Erweitere `src/pages/Settings.tsx` um neue Sektion "Smart Upload Einstellungen":
   - Toggle für "Smart KI Upload standardmäßig aktivieren"
   - Info-Text zur Erklärung
3. Erstelle neue Komponente `src/components/upload/AiConfirmationDialog.tsx`:
   - AlertDialog mit Warnung zur KI-Analyse
   - Checkbox "Dieses Fenster nicht mehr anzeigen"
   - Bestätigen/Abbrechen Buttons
4. Erweitere `FileUpload.tsx`:
   - Lade `user_preferences` beim Component Mount
   - Wenn `smart_upload_enabled === false`, setze Checkbox "Mit KI analysieren" auf false
   - Wenn `smart_upload_enabled === true` und `show_ai_confirmation === true`:
     - Zeige `AiConfirmationDialog` vor Upload
     - Bei Bestätigung mit gesetzter Checkbox: Update `show_ai_confirmation = false` in DB
5. Implementiere i18n für alle neuen Texte
6. Optional: Logging in `audit_logs` Tabelle für KI-Zustimmungen

**Zielergebnis:**  
Ein datenschutzfreundliches, transparentes Verhalten mit klarer Nutzerentscheidung bei jeder KI-basierten Analyse.

---

## 🧩 **Thema 4 – Tippverzögerung bei der Dokumentensuche (Debounce)**

**Ziel:**  
Die Suche im Dashboard soll nicht nach jedem Buchstaben neu laden, sondern erst, wenn der Nutzer kurz aufgehört hat zu tippen.

**Kontext:**  
- Betroffene Komponenten: `src/components/documents/FilterPanel.tsx` oder Suchfeld in `src/pages/Index.tsx`
- Zu implementieren: Debounce-Hook für Sucheingabe

**Schritte:**  
1. Erstelle Custom Hook `src/hooks/useDebounce.ts`:
   ```typescript
   import { useEffect, useState } from 'react';
   
   export function useDebounce<T>(value: T, delay: number = 500): T {
     const [debouncedValue, setDebouncedValue] = useState<T>(value);
     
     useEffect(() => {
       const handler = setTimeout(() => {
         setDebouncedValue(value);
       }, delay);
       
       return () => clearTimeout(handler);
     }, [value, delay]);
     
     return debouncedValue;
   }
   ```
2. Identifiziere die Komponente mit Suchfeld (wahrscheinlich `FilterPanel.tsx` oder `Index.tsx`)
3. Implementiere zwei separate States:
   - `searchInput` für sofortiges UI-Feedback
   - `debouncedSearch = useDebounce(searchInput, 600)` für tatsächliche Query
4. Verwende `debouncedSearch` für Supabase-Queries
5. Füge Ladeindikator hinzu, der während Debounce-Zeit sichtbar ist
6. Stelle sicher, dass Cursor-Position im Input erhalten bleibt
7. Teste mit schnellem Tippen (sollte nur 1 Query nach Pause auslösen)

**Zielergebnis:**  
Flüssiges, modernes Suchverhalten wie bei gängigen Web-Apps – kein Re-Fokus und kein Tippen-Unterbrechen mehr.

---

## 🧩 **Thema 5 – Erweiterte Filter für neue Dokumententypen**

**Ziel:**  
Die neuen Dokumententypen aus Thema 2 sollen als Multi-Select-Filter in der Dokumentensuche verfügbar sein.

**Kontext:**  
- Filter-Komponente: `src/components/documents/FilterPanel.tsx`
- Abhängigkeit: Thema 2 muss abgeschlossen sein
- DB-Feld: `files.document_type` (falls nicht vorhanden, via Migration hinzufügen)

**Schritte:**  
1. **Datenbank-Migration (falls nötig):** Füge `document_type` Spalte zu `files` Tabelle hinzu:
   ```sql
   ALTER TABLE files ADD COLUMN IF NOT EXISTS document_type TEXT;
   CREATE INDEX IF NOT EXISTS idx_files_document_type ON files(document_type);
   ```
2. Erweitere `FilterPanel.tsx` um Multi-Select für Dokumententypen:
   - Verwende shadcn `Command` oder `MultiSelect` Component
   - Importiere `DOCUMENT_TYPES` aus `src/lib/documentTypes.ts`
   - Zeige lokalisierte Labels basierend auf User-Sprache
3. Implementiere State für ausgewählte Typen: `selectedTypes: string[]`
4. Erweitere die Supabase-Query in `Index.tsx`:
   ```typescript
   let query = supabase.from('files').select('*');
   if (selectedTypes.length > 0) {
     query = query.in('document_type', selectedTypes);
   }
   ```
5. Füge "Active Filter Badges" oberhalb der Dokumentenliste hinzu:
   - Zeige Chips für jeden aktiven Filter
   - "×" Button zum Entfernen einzelner Filter
   - "Alle Filter zurücksetzen" Button
6. Speichere Filter-Auswahl in `localStorage` für Session-Persistenz
7. Kombiniere mit bestehenden Filtern (Datum, Tags, etc.)

**Zielergebnis:**  
Eine konsistente Filterstruktur, die alle neuen Kategorien abbildet, intelligent verknüpft und komfortables Durchsuchen ermöglicht.

---

## 🧩 **Thema 6 – Lovable Analyse & Verbesserungsvorschläge (aus Kundensicht)**

**Ziel:**  
Analyse der gesamten Anwendung aus Sicht verschiedener Kundengruppen (jugendlich, berufstätig, älter, digital-unerfahren) mit konkreten Verbesserungsvorschlägen.

**Kontext:**  
- Dies ist eine analytische Aufgabe ohne Code-Änderungen
- Ergebnis: Textdokument mit strukturierten Empfehlungen

**Schritte:**  
1. **Analyse der Nutzerführung:**
   - Prüfe alle Hauptseiten: Landing, Auth, Index (Dashboard), Settings, Upload-Flow
   - Bewerte Verständlichkeit von Texten, Labels, Buttons für verschiedene Altersgruppen
   - Identifiziere komplexe Begriffe oder Fachsprache
2. **UX-Evaluation für Zielgruppen:**
   - **Jugendlich (16-25):** Erwartungen an moderne UI, Geschwindigkeit, Mobile-First
   - **Berufstätig (25-55):** Effizienz, Produktivität, schnelle Orientierung
   - **Älter (55+):** Größere Schrift, klare Kontraste, einfache Navigation
   - **Digital-unerfahren:** Tooltips, Hilfe-Texte, Guided Tours
3. **Fachliche Bewertung:**
   - KI-Erklärungen: Sind Smart Upload Funktionen verständlich erklärt?
   - Datenschutz: Werden Datenverarbeitung und KI-Nutzung transparent kommuniziert?
   - Fehlermeldungen: Sind Fehler nutzerfreundlich formuliert?
4. **Barrierefreiheit:**
   - Kontraste (WCAG AA Standard)
   - Keyboard-Navigation
   - Screen-Reader Kompatibilität (ARIA-Labels)
   - Font-Sizes (min. 16px für Body-Text)
5. **Erstelle strukturierten Bericht:**
   - **Teil 1: Fachlich-technische Empfehlungen**
   - **Teil 2: UX-Verbesserungen aus Kundensicht**
   - **Teil 3: Altersübergreifende Nutzerfreundlichkeit**
   - **Teil 4: Priorisierte Handlungsfelder** (Hoch / Mittel / Niedrig)
6. Speichere Bericht als `ANALYSIS_UX_IMPROVEMENTS.md` im Projekt-Root

**Zielergebnis:**  
Ein fundierter, verständlicher Bericht, der zeigt, welche fachlichen, gestalterischen und sprachlichen Anpassungen nötig sind, damit das System für alle Zielgruppen gleichermaßen sinnvoll und zugänglich ist.

---

## 🔁 **Umsetzungsreihenfolge**

**Empfohlene Reihenfolge:**
1. Thema 4 (Debounce) – Schnell umzusetzen, sofortige UX-Verbesserung
2. Thema 1 (Dynamische Pfade) – Wichtig für Upload-Erlebnis
3. Thema 2 (Dokumententypen) – Grundlage für Thema 5
4. Thema 3 (Sicherheitsabfrage) – Datenschutz-relevant, sollte vor Rollout live sein
5. Thema 5 (Filter) – Baut auf Thema 2 auf
6. Thema 6 (Analyse) – Kann parallel laufen, liefert Input für weitere Iterationen

**Abschluss:**  
Wenn du mit diesem Dokument arbeitest, sag in Lovable einfach:  
> „Starte mit Thema [Nummer] in IMPROVEMENT_PROMPTS_SMART_UPLOAD.md"

Lovable führt dich dann automatisch durch alle Optimierungen.

---

## 📋 **Checkliste für Lovable AI**

Vor jedem Thema:
- [ ] Bestehende Komponenten identifiziert und gelesen
- [ ] Abhängigkeiten zu anderen Themen geprüft
- [ ] Datenbank-Änderungen erforderlich? → Migration erstellen
- [ ] i18n-Texte benötigt? → de.json + en.json aktualisieren
- [ ] Design-System beachtet? → Nur HSL-Farben, semantic tokens verwenden
- [ ] Tests erforderlich? → E2E-Test in `tests/e2e/` erstellen

Nach jedem Thema:
- [ ] Funktionalität getestet (Preview überprüft)
- [ ] Console-Logs auf Fehler geprüft
- [ ] RLS-Policies korrekt gesetzt
- [ ] User-Feedback eingeholt (falls möglich)
- [ ] PROGRESS_LOG.md aktualisiert
