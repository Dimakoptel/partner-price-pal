import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  alt?: string;
}

export default function ImageGalleryDialog({ images, initialIndex = 0, open, onClose, alt }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const filteredImages = images.filter(Boolean);
  if (filteredImages.length === 0) return null;

  const goNext = () => setCurrentIndex((i) => (i + 1) % filteredImages.length);
  const goPrev = () => setCurrentIndex((i) => (i - 1 + filteredImages.length) % filteredImages.length);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl p-0 bg-black/95 border-none">
        <div className="relative flex items-center justify-center min-h-[400px]">
          <img
            src={filteredImages[currentIndex]}
            alt={alt || `Фото ${currentIndex + 1}`}
            className="max-h-[70vh] max-w-full object-contain"
          />

          {filteredImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={goPrev}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={goNext}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">
            {currentIndex + 1} / {filteredImages.length}
          </div>
        </div>

        {filteredImages.length > 1 && (
          <div className="flex gap-2 p-3 justify-center bg-black/80">
            {filteredImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                  i === currentIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
