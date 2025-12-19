/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '1rem',
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				brand: {
					blue: {
						50: '#EFF6FF',
						100: '#DBEAFE',
						200: '#BFDBFE',
						300: '#60A5FA',
						400: '#3B82F6',
						500: '#2563EB',
						600: '#1E40AF',
						700: '#1E3A8A',
						800: '#1E3A8A',
						900: '#1E293B',
					},
					teal: {
						50: '#F0FDFA',
						100: '#CCFBF1',
						200: '#99F6E4',
						300: '#5EEAD4',
						400: '#2DD4BF',
						500: '#0891B2',
						600: '#0E7490',
						700: '#155E75',
					},
				},
				accent: {
					coral: '#EC4899',
					amber: '#D97706',
					green: '#059669',
				},
				background: {
					primary: '#FFFFFF',
					secondary: '#F8FAFC',
					tertiary: '#F1F5F9',
				},
				text: {
					primary: '#1F2937',
					secondary: '#374151',
					tertiary: '#6B7280',
					inverse: '#FFFFFF',
				},
				border: {
					DEFAULT: '#E5E7EB',
					light: '#F3F4F6',
				},
				semantic: {
					success: '#059669',
					warning: '#D97706',
					error: '#DC2626',
					info: '#2563EB',
				},
			},
			fontFamily: {
				primary: ['Cairo', 'system-ui', '-apple-system', 'sans-serif'],
			},
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				lg: '1.125rem',
				xl: '1.25rem',
				'2xl': '1.5rem',
			},
			spacing: {
				1: '0.25rem',
				2: '0.5rem',
				3: '0.75rem',
				4: '1rem',
				5: '1.25rem',
				6: '1.5rem',
				8: '2rem',
				10: '2.5rem',
				12: '3rem',
				16: '4rem',
			},
			borderRadius: {
				sm: '0.25rem',
				base: '0.5rem',
				lg: '0.75rem',
				full: '9999px',
			},
			boxShadow: {
				sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
				base: '0 2px 8px rgba(0, 0, 0, 0.08)',
				hover: '0 4px 12px rgba(0, 0, 0, 0.12)',
				modal: '0 8px 24px rgba(0, 0, 0, 0.15)',
			},
			transitionDuration: {
				fast: '150ms',
				base: '250ms',
				slow: '350ms',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
