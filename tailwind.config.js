/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      width: {
        128: "32rem",
        256: "64rem",
      },
    },
  },
  plugins: [daisyui],
};
