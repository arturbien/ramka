'use client';

import Image from 'next/image';
import * as Lightbox from '@ramka/react/lightbox';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

import { lightboxImages } from '../../../_data/lightbox-images';
import {
  LightboxTriggerGrid,
  LightboxTriggerImage,
  lightboxChromeButton,
  triggerFocusClass,
} from '../../../_components/lightbox-chrome';

/**
 * A small self-contained viewer with `closeOnEmptyClick` on. The toolbar row
 * is marked `data-ramka-no-pull`, so a click in the gaps between its buttons
 * (or on a disabled, `pointer-events: none` button) never closes; the caption
 * placard is a Caption part, which keeps its click on its own.
 */
export function CloseOnEmptyClickDemo() {
  return (
    <Lightbox.Root>
      <LightboxTriggerGrid>
        {lightboxImages.map((img, i) => (
          <Lightbox.Trigger key={img.id} index={i} className={`block overflow-hidden rounded-2xl ${triggerFocusClass}`}>
            <LightboxTriggerImage src={img.src} alt={img.alt} />
          </Lightbox.Trigger>
        ))}
      </LightboxTriggerGrid>

      <Lightbox.Portal>
        <Lightbox.Backdrop className="lightbox-demo-backdrop lightbox-demo-backdrop-light fixed inset-0" />
        <Lightbox.Content
          aria-label="Close on empty click demo"
          closeOnEmptyClick
          className="lightbox-demo-content fixed inset-0 flex flex-col overscroll-contain outline-none"
        >
          <Lightbox.Slides
            aria-label="Full-size images"
            className="lightbox-demo-slides flex-1 [&::-webkit-scrollbar]:hidden"
          >
            {lightboxImages.map((img, i) => (
              <Lightbox.Slide key={img.id} className="lightbox-demo-slide-pad h-full">
                <Lightbox.Item index={i} caption={img.caption}>
                  <Lightbox.Zoom maxZoom={4}>
                    <Lightbox.Media
                      width={img.src.width}
                      height={img.src.height}
                      className="overflow-hidden rounded-none md:rounded-lg"
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        sizes="100vw"
                        loading="eager"
                        draggable={false}
                        className="select-none"
                      />
                    </Lightbox.Media>
                  </Lightbox.Zoom>
                </Lightbox.Item>
              </Lightbox.Slide>
            ))}
          </Lightbox.Slides>

          <div
            data-ramka-no-pull=""
            className="lightbox-demo-chrome-top lightbox-demo-chrome-hide absolute end-3 top-[calc(0.75rem+env(safe-area-inset-top,0px))] z-30 flex gap-2"
          >
            <Lightbox.ZoomOut className={lightboxChromeButton} aria-label="Zoom out">
              <ZoomOut aria-hidden className="h-4 w-4" strokeWidth={2.25} />
            </Lightbox.ZoomOut>
            <Lightbox.ZoomIn className={lightboxChromeButton} aria-label="Zoom in">
              <ZoomIn aria-hidden className="h-4 w-4" strokeWidth={2.25} />
            </Lightbox.ZoomIn>
            <Lightbox.Close className={lightboxChromeButton} aria-label="Close">
              <X aria-hidden className="h-[18px] w-[18px]" strokeWidth={2.25} />
            </Lightbox.Close>
          </div>

          <div className="lightbox-demo-chrome-bottom lightbox-demo-chrome-hide pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <Lightbox.Caption className="block max-w-full truncate text-[13px] font-medium leading-tight text-neutral-900 dark:text-neutral-50" />
          </div>
        </Lightbox.Content>
      </Lightbox.Portal>
    </Lightbox.Root>
  );
}
