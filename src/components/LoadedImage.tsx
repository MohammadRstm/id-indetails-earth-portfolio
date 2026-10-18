import { useLayoutEffect, useRef, type ImgHTMLAttributes } from 'react';

/**
 * An image that stays invisible until it has fully loaded, then fades in
 * (see `img[data-loaded]` in the styles). Large photos would otherwise appear
 * a band at a time from the top while they download.
 */
export function LoadedImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const imageRef = useRef<HTMLImageElement>(null);

  // A photo already in the cache may finish before React attaches the load handler; a new photo starts hidden.
  useLayoutEffect(() => {
    const image = imageRef.current;
    if (image) image.dataset.loaded = String(image.complete && image.naturalWidth > 0);
  }, [props.src]);

  return (
    <img
      ref={imageRef}
      data-loaded="false"
      {...props}
      onLoad={(event) => {
        event.currentTarget.dataset.loaded = 'true';
        props.onLoad?.(event);
      }}
    />
  );
}
