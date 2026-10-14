/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#07090D",
        surface: "#0D1219",
        "surface-elevated": "#121A23",
        "surface-card": "#151F2C",
        "primary-text": "#F5F7FA",
        muted: "#8B96A5",
        "data-cyan": "#36D9FF",
        "analytics-violet": "#8B5CF6",
        "nie-blue": "#173A8C",
        "nie-bright": "#2563EB",
        "accent-orange": "#FF7A30",
        "accent-amber": "#F59E0B",
        "border-dark": "rgba(255, 255, 255, 0.08)",
        "border-glow": "rgba(54, 217, 255, 0.3)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        editorial: ['"Cinzel Decorative"', '"Cabinet Grotesk"', 'serif'],
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        }
      },
      backgroundImage: {
        'grid-pattern': 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        'hex-pattern': 'radial-gradient(rgba(54, 217, 255, 0.1) 1px, transparent 0)',
        'cyber-gradient': 'linear-gradient(135deg, rgba(54,217,255,0.15) 0%, rgba(139,92,246,0.15) 50%, rgba(255,122,48,0.1) 100%)',
      }
    },
  },
  plugins: [],
}
