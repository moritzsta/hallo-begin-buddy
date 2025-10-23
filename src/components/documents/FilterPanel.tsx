import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Filter, FolderOpen } from 'lucide-react';
import { getAllDocumentTypes, getDocumentTypeLabel } from '@/lib/documentTypes';

export interface FileFilters {
  mimeTypes: string[];
  dateFrom: string;
  dateTo: string;
  sizeMin: number;
  sizeMax: number;
  tags: string[];
  documentTypes: string[];
}

interface FilterPanelProps {
  filters: FileFilters;
  onFiltersChange: (filters: FileFilters) => void;
  availableTags: string[];
  onClearFilters: () => void;
}

const COMMON_MIME_TYPES = [
  { value: 'application/pdf', label: 'PDF' },
  { value: 'image/', label: 'Images' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel' },
  { value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PowerPoint' },
  { value: 'text/', label: 'Text Files' },
];

export const FilterPanel = ({
  filters,
  onFiltersChange,
  availableTags,
  onClearFilters,
}: FilterPanelProps) => {
  const { t, i18n } = useTranslation();

  const handleMimeTypeToggle = (mimeType: string) => {
    const newMimeTypes = filters.mimeTypes.includes(mimeType)
      ? filters.mimeTypes.filter(m => m !== mimeType)
      : [...filters.mimeTypes, mimeType];
    onFiltersChange({ ...filters, mimeTypes: newMimeTypes });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleDocumentTypeToggle = (type: string) => {
    const newTypes = filters.documentTypes.includes(type)
      ? filters.documentTypes.filter(t => t !== type)
      : [...filters.documentTypes, type];
    onFiltersChange({ ...filters, documentTypes: newTypes });
  };

  const hasActiveFilters =
    filters.mimeTypes.length > 0 ||
    filters.tags.length > 0 ||
    filters.documentTypes.length > 0 ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.sizeMin > 0 ||
    filters.sizeMax < Infinity;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" />
          {t('filters.title')}
        </CardTitle>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            {t('filters.clear')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Type Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">{t('filters.fileType')}</Label>
          <div className="space-y-2">
            {COMMON_MIME_TYPES.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`mime-${value}`}
                  checked={filters.mimeTypes.includes(value)}
                  onCheckedChange={() => handleMimeTypeToggle(value)}
                />
                <label
                  htmlFor={`mime-${value}`}
                  className="text-sm cursor-pointer select-none"
                >
                  {label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">{t('filters.dateRange')}</Label>
          <div className="space-y-2">
            <div>
              <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                {t('filters.from')}
              </Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateFrom: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                {t('filters.to')}
              </Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateTo: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Size Range Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">{t('filters.sizeRange')}</Label>
          <div className="space-y-2">
            <div>
              <Label htmlFor="size-min" className="text-xs text-muted-foreground">
                {t('filters.minSize')} (KB)
              </Label>
              <Input
                id="size-min"
                type="number"
                min="0"
                value={filters.sizeMin === 0 ? '' : filters.sizeMin / 1024}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    sizeMin: e.target.value ? parseFloat(e.target.value) * 1024 : 0,
                  })
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="size-max" className="text-xs text-muted-foreground">
                {t('filters.maxSize')} (MB)
              </Label>
              <Input
                id="size-max"
                type="number"
                min="0"
                value={
                  filters.sizeMax === Infinity ? '' : filters.sizeMax / (1024 * 1024)
                }
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    sizeMax: e.target.value
                      ? parseFloat(e.target.value) * 1024 * 1024
                      : Infinity,
                  })
                }
                placeholder={t('filters.unlimited')}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Document Types Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              {t('filters.documentType')}
            </Label>
            {filters.documentTypes.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.documentTypes.length}
              </Badge>
            )}
          </div>
          <div className="border-2 rounded-md bg-muted/20">
            <div className="space-y-1.5 max-h-64 overflow-y-auto p-2">
              {getAllDocumentTypes().map((type) => (
                <div 
                  key={type} 
                  className="flex items-center space-x-2 hover:bg-accent/50 rounded px-2 py-1.5 transition-colors"
                >
                  <Checkbox
                    id={`doctype-${type}`}
                    checked={filters.documentTypes.includes(type)}
                    onCheckedChange={() => handleDocumentTypeToggle(type)}
                    className="shrink-0"
                  />
                  <label
                    htmlFor={`doctype-${type}`}
                    className="text-sm cursor-pointer select-none flex-1 leading-tight"
                  >
                    {getDocumentTypeLabel(type, i18n.language)}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">{t('filters.tags')}</Label>
              {filters.tags.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.tags.length}
                </Badge>
              )}
            </div>
            <div className="border-2 rounded-md bg-muted/20">
              <div className="space-y-1.5 max-h-64 overflow-y-auto p-2">
                {availableTags.sort().map((tag) => (
                  <div 
                    key={tag}
                    className="flex items-center space-x-2 hover:bg-accent/50 rounded px-2 py-1.5 transition-colors"
                  >
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={filters.tags.includes(tag)}
                      onCheckedChange={() => handleTagToggle(tag)}
                      className="shrink-0"
                    />
                    <label
                      htmlFor={`tag-${tag}`}
                      className="text-sm cursor-pointer select-none flex-1 leading-tight"
                    >
                      {tag}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
