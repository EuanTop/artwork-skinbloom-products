import type { OriginalBubble } from './original-content';

export type OriginalTheme = 'light' | 'dark';
export type OriginalScene = ReturnType<typeof originalScene>;

// SwiftUI places the artwork on one canvas. Preserve that canvas in compact
// Web views; below reading size, the viewer can pan across it.
export function originalScene(viewWidth: number, viewHeight: number, poster: boolean) {
  const width = Math.max(1032, viewWidth);
  const height = poster ? 900 : Math.max(774, viewHeight);
  const scale = poster ? Math.min(1, viewWidth / width)
    : Math.min(1, Math.max(.68, viewWidth / width));
  return { width, height, scale };
}

export function originalBubblePosition(bubble: OriginalBubble, scene: OriginalScene) {
  const { width, height } = scene;
  const originX = width / 2;
  // Preserve the original 4:3 choreography on wide monitors. The card
  // gradient still spans the available width.
  const compositionWidth = Math.min(width, height * 4 / 3);
  // Native Canvas translates by -300 on its screen space, which
  // extends beyond the card. In the visible native card the origin
  // is at 21% of the measured card height (the iPad reference).
  const originY = height * .21;
  return {
    x: originX + bubble.offsetXFactor * compositionWidth,
    y: originY + bubble.offsetYFactor * height,
    diameter: bubble.radiusFactor * Math.min(width, height),
    fromX: -bubble.offsetXFactor * compositionWidth,
    fromY: -bubble.offsetYFactor * height,
  };
}
