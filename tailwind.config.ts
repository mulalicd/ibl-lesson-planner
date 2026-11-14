import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    // P6 S1 (CONSTITUTION rule 6 as amended, DL-P33): the ONLY colours that exist in this app. This replaces
    // Tailwind's default palette, so a class like bg-emerald-100 is not generated at all. `npm run
    // colours:check` scans the built CSS and fails on any other colour value.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      white: "#FFFFFF",
      black: "#000000",
      neutral: {
        50: "#FAFAFA", 100: "#F5F5F5", 200: "#E5E5E5", 300: "#D4D4D4", 400: "#A3A3A3",
        500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717",
      },
      // Tailwind's base styles read colors.gray (placeholder text); point it at the same neutral greys.
      gray: {
        50: "#FAFAFA", 100: "#F5F5F5", 200: "#E5E5E5", 300: "#D4D4D4", 400: "#A3A3A3",
        500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717",
      },
      brand: {
        black: "rgb(var(--brand-black) / <alpha-value>)",
        red: "rgb(var(--brand-red) / <alpha-value>)",
        blue: "rgb(var(--brand-blue) / <alpha-value>)",
        yellow: "rgb(var(--brand-yellow) / <alpha-value>)",
        lightblue: "rgb(var(--brand-lightblue) / <alpha-value>)",
      },
      border: "rgb(var(--border) / <alpha-value>)",
      input: "rgb(var(--input) / <alpha-value>)",
      ring: "rgb(var(--ring) / <alpha-value>)",
      background: "rgb(var(--background) / <alpha-value>)",
      foreground: "rgb(var(--foreground) / <alpha-value>)",
      primary: { DEFAULT: "rgb(var(--primary) / <alpha-value>)", foreground: "rgb(var(--primary-foreground) / <alpha-value>)" },
      secondary: { DEFAULT: "rgb(var(--secondary) / <alpha-value>)", foreground: "rgb(var(--secondary-foreground) / <alpha-value>)" },
      destructive: { DEFAULT: "rgb(var(--destructive) / <alpha-value>)", foreground: "rgb(var(--destructive-foreground) / <alpha-value>)" },
      muted: { DEFAULT: "rgb(var(--muted) / <alpha-value>)", foreground: "rgb(var(--muted-foreground) / <alpha-value>)" },
      accent: { DEFAULT: "rgb(var(--accent) / <alpha-value>)", foreground: "rgb(var(--accent-foreground) / <alpha-value>)" },
      popover: { DEFAULT: "rgb(var(--popover) / <alpha-value>)", foreground: "rgb(var(--popover-foreground) / <alpha-value>)" },
      card: { DEFAULT: "rgb(var(--card) / <alpha-value>)", foreground: "rgb(var(--card-foreground) / <alpha-value>)" },
      idss: {
        "dark-blue": "rgb(var(--idss-dark-blue) / <alpha-value>)",
        gold: "rgb(var(--idss-gold) / <alpha-value>)",
        "bright-blue": "rgb(var(--idss-bright-blue) / <alpha-value>)",
        red: "rgb(var(--idss-red) / <alpha-value>)",
      },
      status: {
        success: "rgb(var(--status-success) / <alpha-value>)",
        "success-bg": "rgb(var(--status-success-bg) / <alpha-value>)",
      },
      sidebar: {
        DEFAULT: "hsl(var(--sidebar-background))",
        foreground: "hsl(var(--sidebar-foreground))",
        primary: "hsl(var(--sidebar-primary))",
        "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
        accent: "hsl(var(--sidebar-accent))",
        "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
        border: "hsl(var(--sidebar-border))",
        ring: "hsl(var(--sidebar-ring))",
      },
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      // default ring (focus) colour: IDSS Light Blue instead of Tailwind's built-in blue
      ringColor: { DEFAULT: "rgb(var(--ring) / 0.5)" },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        "depth-1": "var(--depth-1)",
        "depth-2": "var(--depth-2)",
        "depth-3": "var(--depth-3)",
        "depth-4": "var(--depth-4)",
        "depth-5": "var(--depth-5)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-gentle": "pulse-gentle 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
