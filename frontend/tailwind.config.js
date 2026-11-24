/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          dark: '#14213D',     // Main Dark navy
          secondary: '#1F3558',// Secondary navy
          light: '#2B4A7A',
        },
        teal: {
          accent: '#14B8A6',   // Teal accent
          hover: '#0D9488',
          light: '#CCFBF1',
        },
        bg: {
          light: '#F5F7FB',    // Light background
        },
        text: {
          primary: '#172033',  // Primary text
          secondary: '#64748B',// Secondary text
          muted: '#94A3B8',
        },
        status: {
          success: '#16A34A',
          warning: '#F59E0B',
          error: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 12px 0 rgba(20, 33, 61, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(20, 33, 61, 0.1), 0 8px 10px -6px rgba(20, 33, 61, 0.04)',
      }
    },
  },
  plugins: [],
}
