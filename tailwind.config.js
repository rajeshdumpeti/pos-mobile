/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--pos-color-background-primary)',
          secondary: 'var(--pos-color-background-secondary)',
        },
        surface: {
          primary: 'var(--pos-color-surface-primary)',
          elevated: 'var(--pos-color-surface-elevated)',
          glass: 'var(--pos-color-surface-glass)',
        },
        text: {
          primary: 'var(--pos-color-text-primary)',
          secondary: 'var(--pos-color-text-secondary)',
          muted: 'var(--pos-color-text-muted)',
          inverse: 'var(--pos-color-text-inverse)',
        },
        border: {
          DEFAULT: 'var(--pos-color-border-default)',
          divider: 'var(--pos-color-divider)',
          focus: 'var(--pos-color-focus-ring)',
        },
        accent: {
          DEFAULT: 'var(--pos-color-accent-primary)',
          pressed: 'var(--pos-color-accent-pressed)',
          soft: 'var(--pos-color-accent-soft)',
          content: 'var(--pos-color-on-accent)',
        },
        status: {
          success: 'var(--pos-color-success)',
          'success-soft': 'var(--pos-color-success-soft)',
          warning: 'var(--pos-color-warning)',
          'warning-soft': 'var(--pos-color-warning-soft)',
          danger: 'var(--pos-color-danger)',
          'danger-soft': 'var(--pos-color-danger-soft)',
          info: 'var(--pos-color-info)',
          'info-soft': 'var(--pos-color-info-soft)',
        },
      },
      spacing: {
        'pos-none': 'var(--pos-spacing-none)',
        'pos-xxs': 'var(--pos-spacing-xxs)',
        'pos-xs': 'var(--pos-spacing-xs)',
        'pos-sm': 'var(--pos-spacing-sm)',
        'pos-md': 'var(--pos-spacing-md)',
        'pos-lg': 'var(--pos-spacing-lg)',
        'pos-xl': 'var(--pos-spacing-xl)',
        'pos-xxl': 'var(--pos-spacing-xxl)',
        'pos-xxxl': 'var(--pos-spacing-xxxl)',
        'pos-huge': 'var(--pos-spacing-huge)',
      },
      borderRadius: {
        'pos-none': 'var(--pos-radius-none)',
        'pos-sm': 'var(--pos-radius-small)',
        'pos-md': 'var(--pos-radius-medium)',
        'pos-lg': 'var(--pos-radius-large)',
        'pos-pill': 'var(--pos-radius-pill)',
      },
      fontSize: {
        'pos-display': [
          'var(--pos-font-size-display)',
          {
            lineHeight: 'var(--pos-line-height-display)',
            letterSpacing: 'var(--pos-letter-spacing-display)',
          },
        ],
        'pos-heading': [
          'var(--pos-font-size-heading)',
          {
            lineHeight: 'var(--pos-line-height-heading)',
            letterSpacing: 'var(--pos-letter-spacing-heading)',
          },
        ],
        'pos-title': ['var(--pos-font-size-title)', 'var(--pos-line-height-title)'],
        'pos-body': ['var(--pos-font-size-body)', 'var(--pos-line-height-body)'],
        'pos-label': ['var(--pos-font-size-label)', 'var(--pos-line-height-label)'],
        'pos-caption': ['var(--pos-font-size-caption)', 'var(--pos-line-height-caption)'],
      },
      fontWeight: {
        'pos-regular': 'var(--pos-font-weight-regular)',
        'pos-medium': 'var(--pos-font-weight-medium)',
        'pos-semibold': 'var(--pos-font-weight-semibold)',
        'pos-bold': 'var(--pos-font-weight-bold)',
      },
      minHeight: { touch: 'var(--pos-minimum-touch-target)' },
      minWidth: { touch: 'var(--pos-minimum-touch-target)' },
      opacity: {
        'pos-disabled': 'var(--pos-opacity-disabled)',
        'pos-pressed': 'var(--pos-opacity-pressed)',
        'pos-muted': 'var(--pos-opacity-muted)',
      },
    },
  },
  plugins: [],
};
