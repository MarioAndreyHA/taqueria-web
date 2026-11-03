/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Esto nos permitirá alternar entre claro y oscuro con un botón
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#f97316',
          dark: '#ea580c',
        }
      }
    },
  },
plugins: [    
  ],
}