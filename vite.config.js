import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. Import cái này

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. Thêm dòng này vào danh sách plugins
  ],
  base: '/ai-english-tutor/', // Giữ nguyên dòng này của bạn
})