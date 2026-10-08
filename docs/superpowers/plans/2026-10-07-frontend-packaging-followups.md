# Giao diện + đóng gói – việc còn lại (hoãn từ review)

Các điểm nhỏ do reviewer phát hiện trong Kế hoạch 2, được đánh giá là chưa cần sửa trước khi merge.

## Quyết định đã đưa ra (Rulings)

- Ruling 1: Accept npm-resolved majors (react-router 8.4 instead of 7, vite 8, vitest 5, typescript 7, jsdom 30) + extra devDep @testing-library/dom — brief imports work unchanged; spec names libs not versions — costs a pin/downgrade if a later task hits API drift.
- Ruling 2: Task 12 frontend-maven-plugin uses nodeVersion v24.15.0 (not v22.12.0) — react-router 8 engines node>=22.22, vitest 5 ^22.12||^24; v24.15.0 = dev machine — costs one re-download if wrong.
- Ruling 3: Task 5 — strengthen plan-mandated ?manual=1 test (assert no POST select), close stale PIN form on no-PIN click, and avoid duplicate profile on create retry (remember created id, retry only selects) — reasonable-user expectations — costs ~10 lines if wrong.
- Ruling 4: Task 8 fix — ReviewPage dueCards gcTime:0 (fresh list each visit, stable within a visit) + test; also fold in Task 6 minor: Flashcard ignores e.repeat and Ctrl/Alt/Meta keys (prevents double SM-2 grading by held key) + test — both protect SM-2 schedule integrity — costs ~10 lines if wrong.
- Ruling 5: Task 11 — send voice always ('' = automatic voice) because backend UpdateProfile treats null as keep; avatar unaffected (picker always has a value) — costs one field if wrong.
- Ruling 6: Final fix wave = Important #1 (shared QueryError with message + Thử lại + link, applied to all listed pages) + #2 (Cache-Control: no-cache for / and /index.html incl. SPA forwards; long cache for /assets/**) + minors: Space ignored when focus is on a non-flip BUTTON/A, Node version in BUILD.md + engines field — reviewer-recommended, cheap — costs one extra round if wrong.
- Ruling 7: Remaining final-review minors parked can-wait: Today button never says 'Tiếp tục' (needs backend flag), downloads save 401 JSON when session expired, deep-link destination lost via /profiles, a11y headings/landmarks/role=alert, mixed Co-Authored-By trailers (accept, no history rewrite), per-question explanations (plan design).

## Điểm nhỏ hoãn lại

- Task 1: minor (deferred): SpaForwardTest asset/favicon asserts only forwardedUrl(null) not 404; POST to client route → 405 (handled by GlobalExceptionHandler ErrorResponse branch since final fix wave — reviewer's 'no handler' claim is stale)
- Task 1: minor (deferred): commit f65b4f1 trailer says Sonnet 5.5 (subagents see a different attribution reminder)
- Task 2: minor (deferred): RED not observed (scaffold); mockApi assumes relative /api URLs (client uses relative — OK)
- Task 3: minor (deferred): Toaster module state/timers persist across tests; error toasts under role=status not alert; non-JSON 200 → generic error; App handler wiring untested
- Task 4: minor (deferred): retry button no loading feedback; SpeakButton gives no feedback when no voice; Chrome cancel()+speak() may drop utterance (verify in real browser); no late voiceschanged test
- Task 5: minor (deferred): no loading/error state for profile list; error texts lack role=alert; avatar group unlabeled; native PIN pattern message not Vietnamese
- Task 6: minor (deferred, flag for final review): Flashcard keydown ignores e.repeat/modifiers — holding '3' or key-repeat Space can grade/flip repeatedly; no RED captured; ExerciseSet/Flashcard test gaps
- Task 7: minor (deferred, flag for final review): LessonView shows 'Đang tải bài học…' forever when lesson query errors (e.g. UNIT_LOCKED via bookmark) — only a toast; redundant ['lesson'] refetch after submit
- Task 8: minor (deferred): blank panel on inconsistent step; Today/Review show loading forever on query error (toast only); StepBar timer measures page time; DONE links no flex-wrap
- Task 9: minor (deferred): add-word sends '' for optional fields (stored as empty strings); query error → loading forever on roadmap/lessons; search input untested
- Task 10: minor (deferred): heatmap date math untested beyond today's cell; heatmap aria-label on role-less div; stats loading forever on error
- Task 11: minor (deferred): after shutdown overlay, refetches against dead server may toast errors; declined-confirm/backup-dir/non-JSON tests missing; key collisions on identical error strings
- Task 11: minor (deferred): Toaster module state leaks across tests (duplicate toast text seen)
- Task 12: minor (deferred): stale frontend/dist can be bundled by a plain ./mvnw package (no -Papp) — doc note or move resource into app profile
- Task 13: minor (deferred): no trap cleanup on failure; no retry on transient zip lock; VERSION duplicated from pom
- Task 14: minor (deferred): possible strict-mode duplicate on 'Lộ trình' heading; redundant stop()
- Task 14: minor (deferred): startup rmSync of %TEMP%\ielts-e2e has no retry/friendly message if a stale java holds the DB
- Final: parked — BackupSettings queries lack error UI; retry button has no pending state
