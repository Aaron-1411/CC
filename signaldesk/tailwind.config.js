/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0e14',
        panel: '#11161f',
        panel2: '#161d29',
        edge: '#222b3a',
        muted: '#8a97ab',
        long: '#16c784',
        short: '#ea3943',
        flag: '#f5a524',
        accent: '#4c8dff',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
