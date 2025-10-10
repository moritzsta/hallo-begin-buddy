import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName: string;
}

export function ImageLightbox({ isOpen, onClose, imageUrl, fileName }: ImageLightboxProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none">
        <div className="relative w-full h-full flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <motion.img
            src={imageUrl}
            alt={fileName}
            className="max-w-full max-h-[90vh] object-contain"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          />
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
            <p className="text-sm font-medium">{fileName}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
