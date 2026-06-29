/** ONE WAY design tokens (React Native) — alignés sur le logo (bleu marine + orange). */
export const colors = {
  brand50: '#eef2fb',
  brand100: '#d8e1f4',
  brand500: '#3f5cc0',
  brand600: '#2a44a0',
  brand700: '#223a82',
  brand900: '#1b2a5e',
  brand950: '#16224d',
  amber400: '#ff9a3c',
  amber500: '#f07d1a',
  amber600: '#d96a0c',
  ink: '#0b1220',
  inkSoft: '#1b2433',
  inkMuted: '#5b6678',
  bg: '#f6f8fc',
  card: '#ffffff',
  border: '#e2e8f0',
  green: '#16a34a',
  greenBg: '#dcfce7',
  red: '#e11d48',
  redBg: '#ffe4e6',
  amberBg: '#fef3c7',
  slateBg: '#f1f5f9',
  white: '#ffffff',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };
export const spacing = (n: number) => n * 4;

export const tones = {
  slate: { bg: colors.slateBg, fg: colors.inkMuted },
  blue: { bg: colors.brand50, fg: colors.brand700 },
  amber: { bg: colors.amberBg, fg: colors.amber600 },
  green: { bg: colors.greenBg, fg: colors.green },
  red: { bg: colors.redBg, fg: colors.red },
} as const;

export type ToneKey = keyof typeof tones;

export const shadow = {
  shadowColor: '#0b1220',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};
