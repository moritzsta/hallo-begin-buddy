import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreVertical, Plus, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFolders, type Folder as FolderType } from '@/hooks/useFolders';
import { useFolderUnreadCounts } from '@/hooks/useFolderUnreadCounts';
import { useUnsortedFolder } from '@/hooks/useUnsortedFolder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { listItem, getAnimationProps } from '@/lib/animations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { CreateFolderDialog } from './CreateFolderDialog';
import { RenameFolderDialog } from './RenameFolderDialog';
import { DeleteFolderDialog } from './DeleteFolderDialog';
import { FolderBadgeCount } from './FolderBadgeCount';
const SHOW_UNREAD_BADGES = false;

interface FolderTreeProps {
  selectedFolderId?: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

export function FolderTree({ selectedFolderId, onSelectFolder }: FolderTreeProps) {
  const { t } = useTranslation();
  const { folders } = useFolders();
  const { unreadCounts, resetFolderVisit } = useFolderUnreadCounts();
  const { unsortedFolder, unsortedCount } = useUnsortedFolder();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | undefined>(undefined);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFolder, setRenameFolder] = useState<FolderType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFolder, setDeleteFolder] = useState<FolderType | null>(null);

  const handleSelectFolder = async (folderId: string | null) => {
    // Only reset unread counts if the feature is enabled
    if (folderId && SHOW_UNREAD_BADGES) {
      await resetFolderVisit(folderId);
    }
    onSelectFolder(folderId);
  };

  const toggleExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const getRootFolders = () => {
    // Exclude the system "Unsortiert" folder from regular folder tree
    return folders.filter(f => !f.parent_id && f.meta?.type !== 'unsorted');
  };

  const getChildFolders = (parentId: string) => {
    return folders.filter(f => f.parent_id === parentId);
  };

  const isSystemFolder = (folder: FolderType) => {
    return folder.meta?.system === true || folder.meta?.type === 'unsorted';
  };

  // Compute direct (non-duplicated) unread count for a folder.
  // Our backend stores cumulative counts per folder (including descendants).
  // To avoid double-counting at parents, subtract the children's cumulative counts.
  const getDirectUnreadCount = (folderId: string) => {
    const own = unreadCounts.get(folderId) || 0;
    const children = getChildFolders(folderId);
    const childrenSum = children.reduce((sum, child) => sum + (unreadCounts.get(child.id) || 0), 0);
    return Math.max(0, own - childrenSum);
  };
  const handleCreateFolder = (parentId?: string) => {
    setCreateParentId(parentId);
    setCreateDialogOpen(true);
  };

  const handleRenameFolder = (folder: FolderType) => {
    setRenameFolder(folder);
    setRenameDialogOpen(true);
  };

  const handleDeleteFolder = (folder: FolderType) => {
    setDeleteFolder(folder);
    setDeleteDialogOpen(true);
  };

  const renderFolder = (folder: FolderType, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const children = getChildFolders(folder.id);
    const hasChildren = children.length > 0;
    const unreadCount = getDirectUnreadCount(folder.id);

    return (
      <motion.div key={folder.id} className="select-none" {...getAnimationProps(listItem)}>
        <motion.div
          className={`flex items-center gap-1 py-1 px-2 rounded-md hover:bg-accent group transition-colors ${
            isSelected ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
        >
          {hasChildren && (
            <div
              className="h-4 w-4 flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(folder.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <div
            className="flex-1 flex items-center gap-2 cursor-pointer"
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(folder.id);
              }
              handleSelectFolder(folder.id);
            }}
          >
            {isExpanded && hasChildren ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm truncate">{folder.name}</span>
          </div>

          {SHOW_UNREAD_BADGES && unreadCount > 0 && (
            <FolderBadgeCount count={unreadCount} folderId={folder.id} />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {depth < 2 && (
                <DropdownMenuItem onClick={() => handleCreateFolder(folder.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('folders.createSubfolder')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleRenameFolder(folder)}>
                {t('folders.rename')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteFolder(folder)}
                className="text-destructive"
              >
                {t('folders.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        {isExpanded && hasChildren && (
          <div>
            {children.map(child => renderFolder(child, depth + 1))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-sm font-semibold">{t('folders.title')}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => handleCreateFolder()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Unsortiert folder - always at top */}
      {unsortedFolder && (
        <div
          className={`py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent transition-colors mb-2 border-b pb-2 ${
            selectedFolderId === unsortedFolder.id ? 'bg-accent' : ''
          }`}
          onClick={() => handleSelectFolder(unsortedFolder.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{t('upload.unsorted')}</span>
            </div>
            {unsortedCount > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                {unsortedCount}
              </Badge>
            )}
          </div>
        </div>
      )}

      <div
        className={`py-1 px-2 rounded-md cursor-pointer hover:bg-accent ${
          selectedFolderId === null ? 'bg-accent' : ''
        }`}
        onClick={() => handleSelectFolder(null)}
      >
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{t('folders.allFiles')}</span>
        </div>
      </div>

      <div className="mt-1">
        {getRootFolders().map(folder => renderFolder(folder, 0))}
      </div>

      <CreateFolderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        parentId={createParentId}
      />

      <RenameFolderDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        folder={renameFolder}
      />

      <DeleteFolderDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        folder={deleteFolder}
      />
    </div>
  );
}
