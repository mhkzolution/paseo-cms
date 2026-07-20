import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FCFAF6",
        foreground: "#262421",
        surface: "#FFFFFF",
        sidebar: "#24211D",
        "sidebar-foreground": "#F3F1EC",
        muted: "#8A8782",
        border: "#E8E2D8",
        paseo: {
          DEFAULT: "#9DC93C",
          hover: "#ECF5D2",
          dark: "#688e22",
        },
        accent: {
          DEFAULT: "#9DC93C",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#C8553D",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["var(--font-prompt)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
