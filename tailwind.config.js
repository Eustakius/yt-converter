/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.js",
        "./resources/**/*.jsx",
        "./resources/**/*.vue",
    ],
    theme: {
        extend: {
            colors: {
                bg: '#050505',
                sigil: '#e5e5e5', // Sharp white/grey
                accent: '#ff003c', // Cyberpunk Red/Pink
                dim: '#333333',
            },
            fontFamily: {
                mono: ['"Courier New"', 'Courier', 'monospace'], // Tech feel
                serif: ['"Times New Roman"', 'Times', 'serif'], // Gothic feel
            },
            animation: {
                'glitch': 'glitch 1s linear infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 12s linear infinite',
            },
            keyframes: {
                glitch: {
                    '2%, 64%': { transform: 'translate(2px,0) skew(0deg)' },
                    '4%, 60%': { transform: 'translate(-2px,0) skew(0deg)' },
                    '62%': { transform: 'translate(0,0) skew(5deg)' },
                }
            },
            backgroundImage: {
                'grid-pattern': "linear-gradient(to right, #222 1px, transparent 1px), linear-gradient(to bottom, #222 1px, transparent 1px)",
            }
        },
    },
    plugins: [],
}
