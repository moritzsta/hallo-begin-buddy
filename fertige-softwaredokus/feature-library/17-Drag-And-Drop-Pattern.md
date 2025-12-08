# 17-Drag-And-Drop-Pattern

## Überblick

**Was:** Native HTML5 Drag & Drop API für Prompt-zu-Ordner-Zuordnung und Ordner-Reordering ohne externe Libraries.

**Wann verwenden:**
- Für Datei-/Item-Organisation in Ordnerstrukturen
- Wenn Items zwischen Containern verschoben werden sollen
- Für Reordering von Listen-Elementen

**Komplexität:** Mittel

---

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Drag & Drop System                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │           PromptCard.tsx                 │               │
│  │  (Drag Source)                           │               │
│  │  - draggable="true"                      │               │
│  │  - onDragStart: setData(JSON)            │               │
│  │  - onDragEnd: cleanup                    │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           │ dataTransfer                                    │
│           ▼                                                 │
│  ┌─────────────────────────────────────────┐               │
│  │           Sidebar.tsx                    │               │
│  │  (Drop Target Container)                 │               │
│  │  - onDragOver: preventDefault            │               │
│  │  - Global drag state                     │               │
│  └─────────────────────────────────────────┘               │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────────┐               │
│  │         FolderTreeNode.tsx               │               │
│  │  (Drop Target + Drag Source)             │               │
│  │  - onDragEnter: highlight                │               │
│  │  - onDragLeave: unhighlight              │               │
│  │  - onDrop: handleDrop(JSON)              │               │
│  │  - Drop Zones (above/below)              │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementierung

### Schritt 1: Draggable Prompt Card (Drag Source)

```typescript
// src/components/PromptCard.tsx
const PromptCard = ({ prompt, onMoveToFolder, ...props }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    
    // JSON-Payload mit allen relevanten Daten
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'prompt',
      id: prompt.id,
      title: prompt.title,
      currentFolderId: prompt.folder_id
    }));
    
    e.dataTransfer.effectAllowed = 'move';
    
    // Custom Drag Image
    const dragElement = document.createElement('div');
    dragElement.className = 'bg-primary text-primary-foreground px-3 py-2 rounded shadow-lg';
    dragElement.textContent = prompt.title;
    dragElement.style.position = 'absolute';
    dragElement.style.top = '-1000px';
    document.body.appendChild(dragElement);
    
    e.dataTransfer.setDragImage(dragElement, 0, 0);
    
    // Cleanup nach Drag-Start
    setTimeout(() => document.body.removeChild(dragElement), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`cursor-move ${isDragging ? 'opacity-50 scale-95' : ''}`}
    >
      {/* Card Content */}
    </Card>
  );
};
```

### Schritt 2: Folder Tree Node (Drop Target + Reorderable)

```typescript
// src/components/FolderTreeNode.tsx
interface FolderTreeNodeProps {
  folder: FolderType;
  selectedFolderId: string | null;
  dragOverFolder: string | null;
  onSelect: (folderId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent, folderId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, folderId: string) => void;
  // Folder Reordering
  onFolderDragStart?: (folderId: string) => void;
  onFolderDragEnd?: () => void;
  onFolderReorder?: (draggedId: string, targetId: string, position: 'above' | 'below') => void;
  draggedFolderId?: string | null;
  level?: number;
}

export const FolderTreeNode = ({
  folder,
  dragOverFolder,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onFolderDragStart,
  onFolderDragEnd,
  onFolderReorder,
  draggedFolderId,
  level = 0
}: FolderTreeNodeProps) => {
  const [dropZone, setDropZone] = useState<'above' | 'below' | null>(null);
  
  // Nur Root-Level-Ordner können neu geordnet werden
  const canDrag = !folder.is_system && level === 0;

  // Folder Drag Start (für Reordering)
  const handleFolderDragStart = (e: React.DragEvent) => {
    if (!canDrag) return;
    
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'folder',
      id: folder.id,
      name: folder.name
    }));
    e.dataTransfer.effectAllowed = 'move';
    
    onFolderDragStart?.(folder.id);
  };

  const handleFolderDragEnd = () => {
    setDropZone(null);
    onFolderDragEnd?.();
  };

  // Drop Zone Handling (above/below für Reordering)
  const handleDropZoneDragOver = (e: React.DragEvent, position: 'above' | 'below') => {
    if (!canDrag || draggedFolderId === folder.id) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropZone(position);
  };

  const handleDropZoneDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropZone(null);
    }
  };

  const handleDropZoneDrop = (e: React.DragEvent, position: 'above' | 'below') => {
    e.preventDefault();
    e.stopPropagation();
    setDropZone(null);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'folder' && data.id !== folder.id) {
        onFolderReorder?.(data.id, folder.id, position);
      }
    } catch (error) {
      console.error('Error parsing folder drag data:', error);
    }
  };

  return (
    <div className={level > 0 ? 'ml-4' : ''}>
      {/* Drop Zone Above (für Reordering) */}
      {canDrag && draggedFolderId && draggedFolderId !== folder.id && (
        <div
          className={`h-1 mb-1 transition-all ${
            dropZone === 'above' 
              ? 'bg-primary rounded-full' 
              : 'hover:bg-muted/50'
          }`}
          onDragOver={(e) => handleDropZoneDragOver(e, 'above')}
          onDragLeave={handleDropZoneDragLeave}
          onDrop={(e) => handleDropZoneDrop(e, 'above')}
        />
      )}

      {/* Folder Item */}
      <div
        className={`flex items-center p-2 rounded-lg border transition-all ${
          dragOverFolder === folder.id 
            ? 'ring-2 ring-primary bg-primary/10' 
            : ''
        } ${
          draggedFolderId === folder.id 
            ? 'opacity-50 scale-95' 
            : ''
        }`}
        draggable={canDrag}
        onDragStart={handleFolderDragStart}
        onDragEnd={handleFolderDragEnd}
      >
        {/* Folder Icon and Name */}
        <Folder className="h-4 w-4 mr-2" />
        <span>{folder.name}</span>

        {/* Invisible Drop Target Overlay (für Prompt -> Folder) */}
        <div 
          className={`absolute inset-0 ${
            dragOverFolder === folder.id ? 'bg-primary/5' : ''
          }`}
          onDragOver={onDragOver}
          onDragEnter={(e) => onDragEnter(e, folder.id)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, folder.id)}
        />
      </div>

      {/* Drop Zone Below (für Reordering) */}
      {canDrag && draggedFolderId && draggedFolderId !== folder.id && (
        <div
          className={`h-1 mt-1 transition-all ${
            dropZone === 'below' 
              ? 'bg-primary rounded-full' 
              : 'hover:bg-muted/50'
          }`}
          onDragOver={(e) => handleDropZoneDragOver(e, 'below')}
          onDragLeave={handleDropZoneDragLeave}
          onDrop={(e) => handleDropZoneDrop(e, 'below')}
        />
      )}

      {/* Children (recursive) */}
      {folder.children?.map((child) => (
        <FolderTreeNode
          key={child.id}
          folder={child}
          level={level + 1}
          {...props}
        />
      ))}
    </div>
  );
};
```

### Schritt 3: Sidebar (Container mit Global State)

```typescript
// src/components/Sidebar.tsx
export const Sidebar = ({ folders, onMovePromptToFolder, onReorderFolders }) => {
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [isAnyDragging, setIsAnyDragging] = useState(false);

  // Global Drag Event Listener für Cross-Component Awareness
  useEffect(() => {
    const handleGlobalDragStart = () => setIsAnyDragging(true);
    const handleGlobalDragEnd = () => {
      setIsAnyDragging(false);
      setDragOverFolder(null);
    };

    document.addEventListener('dragstart', handleGlobalDragStart);
    document.addEventListener('dragend', handleGlobalDragEnd);
    
    return () => {
      document.removeEventListener('dragstart', handleGlobalDragStart);
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, []);

  // Prompt -> Folder Drop Handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolder(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Nur wenn wirklich den Ordner verlassen
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverFolder(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'prompt') {
        // Prompt in Ordner verschieben
        await onMovePromptToFolder(data.id, folderId);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Folder Reorder Handler
  const handleFolderReorder = async (
    draggedId: string, 
    targetId: string, 
    position: 'above' | 'below'
  ) => {
    await onReorderFolders(draggedId, targetId, position);
  };

  return (
    <aside className="w-64 border-r">
      <div className="p-4">
        <h2>Ordner</h2>
        
        {folders.map((folder) => (
          <FolderTreeNode
            key={folder.id}
            folder={folder}
            dragOverFolder={dragOverFolder}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFolderDragStart={setDraggedFolderId}
            onFolderDragEnd={() => setDraggedFolderId(null)}
            onFolderReorder={handleFolderReorder}
            draggedFolderId={draggedFolderId}
            isAnyDragging={isAnyDragging}
          />
        ))}
      </div>
    </aside>
  );
};
```

### Schritt 4: Database Update für Ordner-Reordering

```typescript
// Ordner-Reihenfolge in Datenbank speichern
const reorderFolders = async (
  draggedId: string, 
  targetId: string, 
  position: 'above' | 'below'
) => {
  // Aktuelle Ordner-Reihenfolge holen
  const currentOrder = folders.map(f => f.id);
  
  // draggedId aus Array entfernen
  const withoutDragged = currentOrder.filter(id => id !== draggedId);
  
  // Position von targetId finden
  const targetIndex = withoutDragged.indexOf(targetId);
  
  // draggedId an neuer Position einfügen
  const insertIndex = position === 'above' ? targetIndex : targetIndex + 1;
  const newOrder = [
    ...withoutDragged.slice(0, insertIndex),
    draggedId,
    ...withoutDragged.slice(insertIndex)
  ];
  
  // sort_order in Datenbank aktualisieren
  const { error } = await supabase.rpc('reorder_folders', {
    p_folder_ids: newOrder,
    p_parent_id: null // Nur Root-Level
  });
  
  if (error) {
    console.error('Error reordering folders:', error);
  } else {
    // UI aktualisieren
    refetchFolders();
  }
};
```

---

## Visual Feedback Styles

```css
/* Drag Source während Drag */
.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

/* Drop Target Highlight */
.drop-target-active {
  ring: 2px solid hsl(var(--primary));
  background-color: hsl(var(--primary) / 0.1);
}

/* Drop Zone Indicator */
.drop-zone-active {
  height: 4px;
  background-color: hsl(var(--primary));
  border-radius: 9999px;
}
```

---

## Best Practices

1. **JSON Payload:** Immer `type` Property für verschiedene Drag-Typen
2. **Custom Drag Image:** Besseres visuelles Feedback als Browser-Standard
3. **Drop Zones:** Separate Zonen für above/below bei Reordering
4. **Global State:** `isAnyDragging` für Container-übergreifende Awareness
5. **Prevent Default:** Bei `onDragOver` und `onDrop` nicht vergessen
6. **Cleanup:** `onDragEnd` für State-Reset
7. **Accessibility:** Keyboard-Fallback mit aria-labels

---

## Checkliste

- [ ] Drag Source mit `draggable="true"`
- [ ] `onDragStart` mit JSON-Payload
- [ ] Custom Drag Image
- [ ] Drop Target mit `onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop`
- [ ] Visual Feedback für Drag/Drop States
- [ ] Drop Zones für Reordering (above/below)
- [ ] Global Drag State Tracking
- [ ] Database Update nach Drop
- [ ] Error Handling für JSON-Parsing

---

## Querverweise

- **05-Datenstruktur-Pattern:** Ordner-Hierarchien und sort_order
- **06-UI-UX-Pattern:** Hover/Active States
- **15-i18n-Pattern:** Mehrsprachige Drag-Tooltips

---

**Version:** 1.0  
**Stand:** 2025-01-16  
**Basis:** AllMyPrompts PromptManager
