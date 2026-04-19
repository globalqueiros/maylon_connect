module.exports = {
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease-out",
        "fade-out": "fadeOut 0.3s ease-in",
      },
    },
  },
};