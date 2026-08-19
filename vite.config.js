import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages는 https://<user>.github.io/<repo>/ 형태로 서빙되므로 저장소 이름과
  // 일치해야 합니다. 실제 GitHub 저장소 이름이 다르면 이 값을 바꿔주세요.
  base: '/trip-checkin/',
})
