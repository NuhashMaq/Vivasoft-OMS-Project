/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    dark: '#0F4C75',
                    light: '#EAF6FB',
                },
            },
            borderRadius: {
                '2xl': '16px',
                '3xl': '24px',
            },
            boxShadow: {
                'sm': '0 2px 8px rgba(0, 0, 0, 0.1)',
                'lg': '0 4px 12px rgba(0, 0, 0, 0.15)',
            }
        },
    },
    plugins: [],
}
