/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF6B35',
          deep: '#D94A17',
          ink: '#121212',
          cream: '#FFF5E1',
          blush: '#FFD7C6',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Segoe UI"', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 24px 80px rgba(15, 23, 42, 0.12)',
        glow: '0 0 0 1px rgba(255, 255, 255, 0.2), 0 25px 80px rgba(255, 107, 53, 0.18)',
        elevated: '0 25px 70px rgba(15, 23, 42, 0.22)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      backgroundImage: {
        'hero-wash':
          'radial-gradient(circle at top left, rgba(255, 107, 53, 0.25), transparent 35%), radial-gradient(circle at top right, rgba(255, 167, 38, 0.18), transparent 32%), linear-gradient(135deg, rgba(255, 245, 225, 0.94), rgba(255, 255, 255, 0.88))',
        'hero-wash-dark':
          'radial-gradient(circle at top left, rgba(255, 107, 53, 0.18), transparent 35%), radial-gradient(circle at top right, rgba(255, 167, 38, 0.14), transparent 32%), linear-gradient(135deg, rgba(18, 18, 18, 0.94), rgba(11, 16, 26, 0.94))',
        mesh:
          'radial-gradient(circle at 20% 20%, rgba(255, 107, 53, 0.18), transparent 22%), radial-gradient(circle at 80% 10%, rgba(255, 179, 71, 0.16), transparent 18%), radial-gradient(circle at 50% 80%, rgba(255, 107, 53, 0.12), transparent 24%)',
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2.8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
