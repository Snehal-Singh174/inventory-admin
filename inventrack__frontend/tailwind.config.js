module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: 'var(--color-primary)',
                'primary-foreground': 'var(--color-primary-foreground)',
                'primary-100': 'var(--color-primary-100)',
                'primary-500': 'var(--color-primary-500)',
                secondary: 'var(--color-secondary)',
                'secondary-foreground': 'var(--color-secondary-foreground)',
                'secondary-100': 'var(--color-secondary-100)',
                'secondary-500': 'var(--color-secondary-500)',
                background: 'var(--color-background)',
                foreground: 'var(--color-foreground)',
                surface: 'var(--color-surface)',
                'surface-elevated': 'var(--color-surface-elevated)',
                muted: 'var(--color-muted)',
                'muted-foreground': 'var(--color-muted-foreground)',
                accent: 'var(--color-accent)',
                'accent-foreground': 'var(--color-accent-foreground)',
                border: 'var(--color-border)',
                input: 'var(--color-input)',
                ring: 'var(--color-ring)',
                onPrimary: 'var(--color-on-primary)',
                onSecondary: 'var(--color-on-secondary)',
                onBackground: 'var(--color-on-background)',
                onSurface: 'var(--color-on-surface)',
                success: 'var(--color-success)',
                'success-foreground': 'var(--color-success-foreground)',
                successBackground: 'var(--color-success-bg)',
                error: 'var(--color-error)',
                'error-foreground': 'var(--color-error-foreground)',
                errorBackground: 'var(--color-error-bg)',
                destructive: 'var(--color-destructive)',
                'destructive-foreground': 'var(--color-destructive-foreground)',
                warning: 'var(--color-warning)',
                'warning-foreground': 'var(--color-warning-foreground)',
                warningBackground: 'var(--color-warning-bg)',
                info: 'var(--color-info)',
                'info-foreground': 'var(--color-info-foreground)',
                infoBackground: 'var(--color-info-bg)',
            },
            fontFamily: {
                sans: ['DM Sans', 'sans-serif'],
                mono: ['IBM Plex Mono', 'monospace'],
            },
            borderRadius: {
                DEFAULT: 'var(--border-radius)',
                lg: 'var(--border-radius-lg)',
                md: 'var(--border-radius-md)',
                sm: 'var(--border-radius-sm)',
            },
            boxShadow: {
                'elevation-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                'elevation-2': '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
                'elevation-3': '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
                'elevation-4': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
                'elevation-5': '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
                'glow-sm': '0 0 10px var(--color-primary)',
                'glow-md': '0 0 20px var(--color-primary)',
                'glow-lg': '0 0 30px var(--color-primary)',
            },
            animation: {
                // Entrance animations
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'fade-out': 'fadeOut 0.3s ease-in-out',
                'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
                'slide-in-right': 'slideInRight 0.4s ease-out',
                'slide-in-left': 'slideInLeft 0.4s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-down': 'slideDown 0.4s ease-out',
                'scale-in': 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                'scale-out': 'scaleOut 0.2s ease-in',
                
                // Continuous animations
                'pulse-custom': 'pulse 1.5s ease-in-out infinite',
                'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'glow': 'glow 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                
                // Micro-interactions
                'wiggle': 'wiggle 0.5s ease-in-out',
                'shake': 'shake 0.5s ease-in-out',
                'pop': 'pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'rotate-in': 'rotateIn 0.5s ease-out',
                
                // Loading states
                'spin-slow': 'spin 2s linear infinite',
                'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            },
            keyframes: {
                // Fade animations
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeOut: {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                fadeInUp: {
                    '0%': { 
                        opacity: '0',
                        transform: 'translateY(20px)'
                    },
                    '100%': { 
                        opacity: '1',
                        transform: 'translateY(0)'
                    },
                },
                fadeInDown: {
                    '0%': { 
                        opacity: '0',
                        transform: 'translateY(-20px)'
                    },
                    '100%': { 
                        opacity: '1',
                        transform: 'translateY(0)'
                    },
                },
                
                // Slide animations
                slideInRight: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                slideInLeft: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                
                // Scale animations
                scaleIn: {
                    '0%': { 
                        transform: 'scale(0.8)',
                        opacity: '0'
                    },
                    '100%': { 
                        transform: 'scale(1)',
                        opacity: '1'
                    },
                },
                scaleOut: {
                    '0%': { 
                        transform: 'scale(1)',
                        opacity: '1'
                    },
                    '100%': { 
                        transform: 'scale(0.8)',
                        opacity: '0'
                    },
                },
                
                // Continuous animations
                pulse: {
                    '0%, 100%': { transform: 'scale(1)', opacity: '1' },
                    '50%': { transform: 'scale(1.05)', opacity: '0.8' },
                },
                bounceSubtle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                glow: {
                    '0%, 100%': { boxShadow: '0 0 5px var(--color-primary)' },
                    '50%': { boxShadow: '0 0 20px var(--color-primary), 0 0 30px var(--color-primary)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                
                // Micro-interactions
                wiggle: {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(-3deg)' },
                    '75%': { transform: 'rotate(3deg)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
                },
                pop: {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)' },
                },
                rotateIn: {
                    '0%': { 
                        transform: 'rotate(-180deg) scale(0.5)',
                        opacity: '0'
                    },
                    '100%': { 
                        transform: 'rotate(0) scale(1)',
                        opacity: '1'
                    },
                },
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(to right, var(--color-primary), var(--color-primary-500))',
                'gradient-secondary': 'linear-gradient(to right, var(--color-secondary), var(--color-secondary-500))',
                'gradient-radial': 'radial-gradient(circle, var(--color-primary), var(--color-primary-500))',
                'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            },
            transitionDuration: {
                '400': '400ms',
                '600': '600ms',
            },
            transitionTimingFunction: {
                'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
        },
    },
    variants: {
        extend: {
            backgroundColor: ['active', 'disabled', 'group-hover'],
            textColor: ['active', 'disabled', 'group-hover'],
            opacity: ['disabled', 'group-hover'],
            cursor: ['disabled'],
            borderColor: ['active', 'focus', 'group-hover'],
            ringColor: ['hover', 'active'],
            ringOpacity: ['hover', 'active'],
            ringWidth: ['hover', 'active'],
            scale: ['active', 'group-hover'],
            transform: ['hover', 'focus', 'active', 'group-hover'],
            translate: ['active', 'group-hover'],
            boxShadow: ['active', 'group-hover'],
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}