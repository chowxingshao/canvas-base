import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motionEnabled } from './environment.ts';
import { registerMotion } from './register.ts';

export function refreshOnLoad(root: ParentNode = document): () => void {
  if (!motionEnabled()) return () => undefined;
  registerMotion();
  const images = Array.from(root.querySelectorAll('img')).filter(
    (image) => !image.complete,
  );
  let imagesPending = images.length;
  let fontsPending = Boolean(document.fonts?.ready);
  let disposed = false;
  let refreshed = false;

  const refresh = () => {
    if (disposed || refreshed || imagesPending || fontsPending) return;
    refreshed = true;
    ScrollTrigger.refresh();
  };
  const settleImage = () => {
    imagesPending -= 1;
    refresh();
  };
  for (const image of images) {
    image.addEventListener('load', settleImage, { once: true });
    image.addEventListener('error', settleImage, { once: true });
  }
  if (document.fonts?.ready) {
    void document.fonts.ready.then(
      () => {
        fontsPending = false;
        refresh();
      },
      () => {
        fontsPending = false;
        refresh();
      },
    );
  } else fontsPending = false;
  refresh();

  return () => {
    if (disposed) return;
    disposed = true;
    for (const image of images) {
      image.removeEventListener('load', settleImage);
      image.removeEventListener('error', settleImage);
    }
  };
}
