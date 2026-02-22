/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            borderRadius: {
                sm: 'var(--radius-sm)',
                md: 'var(--radius-md)',
                lg: 'var(--radius-lg)',
                xl: 'var(--radius-xl)',
                '2xl': 'var(--radius-2xl)',
                full: 'var(--radius-full)'
            },
            colors: {
                // Primary colors
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                    hover: 'var(--primary-hover)'
                },
                
                // Secondary colors
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                    hover: 'var(--secondary-hover)'
                },
                
                // Accent colors
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                    hover: 'var(--accent-hover)'
                },
                
                // Status colors
                success: {
                    DEFAULT: 'var(--success)',
                    foreground: 'var(--success-foreground)',
                    hover: 'var(--success-hover)'
                },
                
                warning: {
                    DEFAULT: 'var(--warning)',
                    foreground: 'var(--warning-foreground)',
                    hover: 'var(--warning-hover)'
                },
                
                error: {
                    DEFAULT: 'var(--error)',
                    foreground: 'var(--error-foreground)',
                    hover: 'var(--error-hover)'
                },
                
                // Background colors
                background: 'var(--bg-main)',
                'bg-card': 'var(--bg-card)',
                'bg-sidebar': 'var(--bg-sidebar)',
                'bg-muted': 'var(--bg-muted)',
                
                // Text colors
                'text-dark': 'var(--text-dark)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-muted': 'var(--text-muted)',
                'text-light': 'var(--text-light)',
                
                // Border colors
                border: 'var(--border-color)',
                'border-muted': 'var(--border-muted)',
                
                // Shadows
                'shadow-sm': 'var(--shadow-sm)',
                'shadow-md': 'var(--shadow-md)',
                'shadow-lg': 'var(--shadow-lg)',
                'shadow-xl': 'var(--shadow-xl)',
                
                // Custom chart colors (keeping existing)
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            },
            
            // Spacing scale
            spacing: {
                '1': 'var(--space-1)',
                '2': 'var(--space-2)',
                '3': 'var(--space-3)',
                '4': 'var(--space-4)',
                '5': 'var(--space-5)',
                '6': 'var(--space-6)',
                '8': 'var(--space-8)',
                '10': 'var(--space-10)',
                '12': 'var(--space-12)',
                '16': 'var(--space-16)',
                '20': 'var(--space-20)',
                '24': 'var(--space-24)'
            },
            
            // Font sizes
            fontSize: {
                xs: 'var(--font-size-xs)',
                sm: 'var(--font-size-sm)',
                base: 'var(--font-size-base)',
                lg: 'var(--font-size-lg)',
                xl: 'var(--font-size-xl)',
                '2xl': 'var(--font-size-2xl)',
                '3xl': 'var(--font-size-3xl)',
                '4xl': 'var(--font-size-4xl)',
                '5xl': 'var(--font-size-5xl)'
            },
            
            // Font weights
            fontWeight: {
                normal: 'var(--font-weight-normal)',
                medium: 'var(--font-weight-medium)',
                semibold: 'var(--font-weight-semibold)',
                bold: 'var(--font-weight-bold)',
                extrabold: 'var(--font-weight-extrabold)'
            },
            
            // Transitions
            transitionDuration: {
                fast: '150ms',
                normal: '300ms',
                slow: '500ms'
            },
            
            // Gradients
            backgroundImage: {
                'gradient-primary': 'var(--gradient-primary)',
                'gradient-secondary': 'var(--gradient-secondary)',
                'gradient-accent': 'var(--gradient-accent)'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
}
