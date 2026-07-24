module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand tokens
        primary: 'var(--color-primary)',
        'primary-100': 'var(--color-primary-100)',
        'primary-500': 'var(--color-primary-500)',
        secondary: 'var(--color-secondary)',
        'secondary-100': 'var(--color-secondary-100)',
        'secondary-500': 'var(--color-secondary-500)',

        // Surface tokens
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        onPrimary: 'var(--color-on-primary)',
        onSecondary: 'var(--color-on-secondary)',
        onBackground: 'var(--color-on-background)',
        onSurface: 'var(--color-on-surface)',
        border: 'var(--color-border)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',

        // Semantic tokens
        success: 'var(--color-success)',
        successBackground: 'var(--color-success-bg)',
        error: 'var(--color-error)',
        errorBackground: 'var(--color-error-bg)',
        warning: 'var(--color-warning)',
        warningBackground: 'var(--color-warning-bg)',
        info: 'var(--color-info)',
        infoBackground: 'var(--color-info-bg)',

        // Sidebar tokens
        sidebar: 'var(--color-sidebar-bg)',
        sidebarText: 'var(--color-sidebar-text)',
        sidebarTextActive: 'var(--color-sidebar-text-active)',
        sidebarActive: 'var(--color-sidebar-item-active)',
        sidebarBorder: 'var(--color-sidebar-border)',
        sidebarGroup: 'var(--color-sidebar-group-label)',

        // Header tokens
        headerBg: 'var(--color-header-bg)',
        headerBorder: 'var(--color-header-border)',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--border-radius)',
      },
      boxShadow: {
        'elevation-1': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.12)',
        'elevation-2': '0 3px 8px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.08)',
        'elevation-3': '0 10px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
        'sidebar': '2px 0 8px rgba(0,0,0,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
