# Build và chạy

## Phát triển
- Cần Node ≥ 22.22 (khuyên Node 24) khi phát triển frontend; build Maven -Papp tự tải Node 24.15.0.
- Backend: `cd backend && ./mvnw spring-boot:run` (cổng 8765, dữ liệu ở `%USERPROFILE%\.ielts-app`).
- Frontend: `cd frontend && npm install && npm run dev`, mở http://localhost:5173 (proxy `/api` sang 8765).
- Test: `cd backend && ./mvnw test` · `cd frontend && npm test` · E2E: xem mục dưới.

## Jar có giao diện
`cd backend && ./mvnw -Papp clean package -DskipTests` → `backend/target/ielts-app-0.1.0.jar`
(lần đầu tải Node 24 vào `frontend/.node`).
Chỉ `./mvnw -Papp clean package` mới cho jar có giao diện mới nhất (build thường không đóng gói lại `frontend/dist`).

## Bản portable cho Windows
`bash packaging/build-portable.sh` → `dist/IELTS-App-0.1.0-portable.zip`. Giải nén, chạy `IELTS App.exe`.

## E2E
`cd backend && ./mvnw -Papp package -DskipTests && cd ../frontend && npx playwright test`
(dùng trình duyệt Edge có sẵn, dữ liệu tạm riêng, cổng 8775).
