/**
 * Utility functions for color conversion and manipulation
 * Centralized to ensure consistent color handling across the application
 */

/**
 * Converts HSL color to RGBA with specified opacity
 */
export function hslToRgba(hslColor: string, opacity: number): string {
  // Handle hex colors (fallback)
  if (hslColor.startsWith('#')) {
    const hex = hslColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Extract h, s, l from hsl(h, s%, l%) format
  const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) {
    console.warn(`Invalid HSL color format: ${hslColor}`);
    return `rgba(0, 229, 255, ${opacity})`; // fallback
  }
  
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;
  
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${opacity})`;
}

/**
 * Converts any color format to RGBA with opacity
 */
export function toRgba(color: string, opacity: number): string {
  // If already rgba, extract rgb and apply new opacity
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
  }
  
  // If HSL, use hslToRgba
  if (color.startsWith('hsl')) {
    return hslToRgba(color, opacity);
  }
  
  // If hex, convert to rgba
  if (color.startsWith('#')) {
    return hslToRgba(color, opacity);
  }
  
  console.warn(`Unsupported color format: ${color}`);
  return `rgba(0, 0, 0, ${opacity})`;
}

/**
 * Extracts RGB values from hex color
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}
