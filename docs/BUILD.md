# Build và chạy

## Phát triển
- Backend: `cd backend && ./mvnw spring-boot:run` (cổng 8765, dữ liệu ở `%USERPROFILE%\.ielts-app`).
- Frontend: `cd frontend && npm install && npm run dev`, mở http://localhost:5173 (proxy `/api` sang 8765).
- Test: `cd backend && ./mvnw test` · `cd frontend && npm test` · E2E: xem mục dưới.

## Jar có giao diện
`cd backend && ./mvnw -Papp clean package -DskipTests` → `backend/target/ielts-app-0.1.0.jar`
(lần đầu tải Node 24 vào `frontend/.node`).

## Bản portable cho Windows
`bash packaging/build-portable.sh` → `dist/IELTS-App-0.1.0-portable.zip`. Giải nén, chạy `IELTS App.exe`.

## E2E
`cd backend && ./mvnw -Papp package -DskipTests && cd ../frontend && npx playwright test`
(dùng trình duyệt Edge có sẵn, dữ liệu tạm riêng, cổng 8775).
