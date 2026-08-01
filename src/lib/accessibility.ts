import { Platform } from 'react-native';

export const MIN_TOUCH_SIZE = 44;

export function a11yLabel(label: string, hint?: string) {
  return {
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

export function a11yButton(label: string, hint?: string) {
  return {
    accessibilityLabel: label,
    accessibilityRole: 'button' as const,
    accessibilityHint: hint,
    hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
    minHeight: MIN_TOUCH_SIZE,
    minWidth: MIN_TOUCH_SIZE,
  };
}

export function a11yHeader(label: string) {
  return {
    accessibilityLabel: label,
    accessibilityRole: 'header' as const,
  };
}

export function a11yImage(label: string) {
  return {
    accessibilityLabel: label,
    accessibilityRole: 'image' as const,
  };
}

export function focusOrder(order: number) {
  return Platform.OS === 'web' ? { tabIndex: order } : {};
}

export const WCAG_CONTRAST_RATIOS = {
  normalTextAA: 4.5,
  largeTextAA: 3,
  normalTextAAA: 7,
  largeTextAAA: 4.5,
};

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function luminance(r: number, g: number, b: number) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(color1: string, color2: string) {
  const { r: r1, g: g1, b: b1 } = hexToRgb(color1);
  const { r: r2, g: g2, b: b2 } = hexToRgb(color2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsAA(color1: string, color2: string, isLarge = false) {
  return contrastRatio(color1, color2) >= (isLarge ? 3 : 4.5);
}
