export function exportTokens(token, format) {
  const { colors, typography, spacing } = token

  switch (format) {
    case 'css': return exportCSS(colors, typography, spacing)
    case 'json': return exportJSON(colors, typography, spacing)
    case 'tailwind': return exportTailwind(colors, typography, spacing)
    default: return exportCSS(colors, typography, spacing)
  }
}

function exportCSS(colors, typography, spacing) {
  return `:root {
  /* === Colors === */
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-text-muted: ${colors.textMuted};
  --color-border: ${colors.border};
  --color-success: ${colors.success};
  --color-error: ${colors.error};
  --color-warning: ${colors.warning};

  /* === Typography === */
  --font-heading: ${typography.headingFont};
  --font-body: ${typography.bodyFont};
  --font-mono: ${typography.monoFont};
  --font-size-base: ${typography.baseSize};
  --font-weight-light: ${typography.weights?.light || 300};
  --font-weight-normal: ${typography.weights?.normal || 400};
  --font-weight-medium: ${typography.weights?.medium || 500};
  --font-weight-semibold: ${typography.weights?.semibold || 600};
  --font-weight-bold: ${typography.weights?.bold || 700};
  --line-height-tight: ${typography.lineHeights?.tight || 1.2};
  --line-height-normal: ${typography.lineHeights?.normal || 1.5};
  --line-height-relaxed: ${typography.lineHeights?.relaxed || 1.75};

  /* === Spacing === */
  --spacing-unit: ${spacing.baseUnit};
  --spacing-xs: ${spacing.named?.xs || '4px'};
  --spacing-sm: ${spacing.named?.sm || '8px'};
  --spacing-md: ${spacing.named?.md || '16px'};
  --spacing-lg: ${spacing.named?.lg || '24px'};
  --spacing-xl: ${spacing.named?.xl || '32px'};
  --spacing-2xl: ${spacing.named?.['2xl'] || '48px'};

  /* === Radii === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* === Shadows === */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.15);
  --shadow-lg: 0 8px 30px rgba(0,0,0,0.2);
}`
}

function exportJSON(colors, typography, spacing) {
  return JSON.stringify({ colors, typography, spacing }, null, 2)
}

function exportTailwind(colors, typography, spacing) {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '${colors.primary}',
        secondary: '${colors.secondary}',
        accent: '${colors.accent}',
        background: '${colors.background}',
        surface: '${colors.surface}',
        'app-text': '${colors.text}',
        'text-muted': '${colors.textMuted}',
        border: '${colors.border}',
        success: '${colors.success}',
        error: '${colors.error}',
        warning: '${colors.warning}',
      },
      fontFamily: {
        heading: ['${typography.headingFont}'],
        body: ['${typography.bodyFont}'],
        mono: ['${typography.monoFont}'],
      },
      spacing: {
        xs: '${spacing.named?.xs || '4px'}',
        sm: '${spacing.named?.sm || '8px'}',
        md: '${spacing.named?.md || '16px'}',
        lg: '${spacing.named?.lg || '24px'}',
        xl: '${spacing.named?.xl || '32px'}',
        '2xl': '${spacing.named?.['2xl'] || '48px'}',
      },
    },
  },
}`
}
