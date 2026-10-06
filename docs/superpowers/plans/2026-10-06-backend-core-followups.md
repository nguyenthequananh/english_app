# Backend lõi – việc còn lại (hoãn từ review)

Các điểm nhỏ (minor) do reviewer phát hiện trong quá trình làm Kế hoạch 1, được đánh giá là chưa cần sửa trước khi merge. Xem lại khi làm Kế hoạch 2/3.

## Quyết định đã đưa ra (Rulings)

- Ruling 1: Generate the Maven Wrapper with the cached Maven 3.9.9 binary (absolute path above) instead of `mvn` — mvn isn't on PATH — costs nothing if wrong (wrapper output is identical).
- Ruling 2: Task 5 also creates backend/src/main/java/vn/ieltsapp/common/WordCode.java (code is in the task text) — the Files list omitted it — none.
- Ruling 3: Task 1's .gitignore must also contain `.superpowers/` — the SDD workspace lives there and must stay untracked — none.
- Ruling 4: Task 5 — guard null type/day before Set.of(...).contains (NPE on author-omitted fields) and add a test — spec §7 requires import to report field errors, not crash — costs a few lines if wrong.
- Ruling 5: future dispatches — surefire multi-test selector is comma (-Dtest=A,B), not '+' as the plan writes — none.
- Ruling 6: Task 6 — ContentService catches RuntimeException per file (ok=false + log) and ContentImporter rejects cross-file code collisions (lesson/exercise/test code already owned by another unit/lesson/test) — spec §7: per-file isolation, never corrupt/duplicate content; one bad bundled file must not stop app start — costs a few extra queries per import if wrong.
- Ruling 7: Task 14's extra edit wiring StartupRestore.applyPending into IeltsApplication.main is kept — Task 16 rewrites main and includes the same call — costs nothing if wrong (Task 16 overwrites).
- Ruling 8: Task 14 — fix plan-mandated defects: atomic restore (copy to temp + ATOMIC_MOVE, quick_check source), bad marker must not wedge startup, daily backup failure logged not fatal, DailyBackupRunner tests, backup name sort strips .db so '-2' collisions order correctly — spec §8 'restore must not corrupt live DB' + OneDrive dir may be offline — costs ~40 lines if wrong. Pre-migration backup failure stays fatal (deliberate: no migration without a safety copy).
- Ruling 9: Task 16 — main() probes 'our app already running' BEFORE StartupRestore/DbCheck; DbCheck uses busy_timeout and treats only quick_check≠ok / SQLITE_CORRUPT / SQLITE_NOTADB as corruption (busy/locked → leave DB alone); port scan fixed to spec range 8765..8775 starting at saved port if in range — spec §7 range + never touch a live DB — costs ~30 lines if wrong.
- Ruling 10: Final fix wave scope = Important #1–#5 + Minor #6, #7 + catch-all INTERNAL handler + record spec deviations (#11). Daily backup while running via @Scheduled hourly job (NOT inside session creation: pool of 1 → VACUUM inside a transaction would deadlock) — reviewer-recommended, cheap — costs one extra round if wrong.
- Ruling 11: Remaining final-review minors (#8 WAL in pre-restore copy, #9 constants, #10 empty-session streak, #12 session timeout, #13 backup endpoints bypass PIN) and all task-level deferred minors are parked as can-wait per the reviewer's triage.

## Điểm nhỏ hoãn lại

- Task 1: minor (deferred): GlobalExceptionHandler has no catch-all Exception handler (unexpected errors lack `code`)
- Task 1: minor (deferred): test output noise — Mockito/ByteBuddy agent warning
- Task 2: minor (deferred): TestDb.clear doesn't reset sqlite_sequence (no test depends on ids)
- Task 2: minor (deferred): SchemaTest checks table names only (partial unique indexes untested directly)
- Task 3: minor (deferred): no test pins 'previous ease' rule for HARD/EASY on later reviews
- Task 3: minor (deferred): Sm2 interval can be 0 if persisted state inconsistent (reps>=2, interval 0)
- Task 4: minor (deferred): ProfileApiTest gaps — no status asserts on some calls, no 404 select / update-validation / unauth PUT-DELETE tests
- Task 4: minor (deferred): commit d183fdf trailer says 'Claude Sonnet 5.5' instead of 'Claude Opus 5.5'
- Task 4: minor (deferred): no PIN brute-force throttling (localhost app, spec says PIN is a soft lock)
- Task 5: minor (deferred): null elements inside words/lessons/exercises lists still NPE; validator test gaps (options<2, invalid source/type, cross-code collision)
- Task 6: minor (deferred): unknown JSON properties ignored (typo fields not reported); isStage keys on targetBand; bootstrap/multipart-error/rollback tests missing; invalid-unit test checks only unit table; IntegrationTest import order
- Task 6: minor (deferred): no test for RuntimeException path or stage-file collisions; exercise moved between lessons of same unit now rejected
- Task 7: minor (deferred): LIKE search doesn't escape %/_; addUserWord check+insert not atomic (unique violation → 500); no KNOWN-status / limit tests
- Task 8: minor (deferred): onUnitTestPassed writes before unit-exists check; unknown unit → 403 not 404; empty next stage not skipped; statuses() writes on read path; RoadmapTest gaps (listener alone, stage DONE, reopen DONE unit)
- Task 9: minor (deferred): unitLessons doesn't check unit open/exists; displayed answer split on | for MCQ too; no test asserts LessonCompletedEvent publish (Task 12 session test covers it end-to-end)
- Task 10: minor (deferred): unknown stage code → 409 not 404; tests lack weakUnits ordering/boundary/retake/locked-GET cases
- Task 11: minor (deferred): PlannerSettings unvalidated (negative → limit() throws); planner test gaps (same-day lessons, exact cap tail)
- Task 12: minor (deferred, flag for final review): if the session's lesson is completed out-of-band while still in REVIEW/NEW, session stays in LESSON step until resubmitted; againRequeues test doesn't prove end-of-queue; empty session records 1 minute
- Task 13: minor (deferred): knownByWeek counts lapsed words (can diverge from knownWords); testReady true for 0-lesson unit; finishedDays queried twice; testResults path untested
- Task 14: minor (deferred): export temp files accumulate until JVM exit; corrupt config.yml silently reset; FlywayBackupConfig uses LocalDateTime.now() not Clock; unused import in BackupApiTest
- Task 14: minor (deferred): WAL deleted before atomic move (crash window, before-restore copy exists)
- Task 15: minor (deferred): exerciseAttempts/studySessions not counted in skippedRows; malformed import → DB constraint 500 not IMPORT_INVALID; blank name not rejected; export file contains pin hash
- Task 16: minor (deferred): startup race (second launch while first still booting); choosePort failure unfriendly; HttpClient not closed; no positive isOurApp test; BrowserOpener fallback port; 'Th?' in smoke output attributed to Windows console encoding (unproven)
- Final: parked — re-import deleting today's session lesson leaves session at LESSON until next day — Ruling: rare, no corruption, next day normal; follow-up: settle() treats missing lesson as done
- Final: parked — duplicate shutdown POSTs start two exit threads; LocalOriginFilter relies on getServerName (don't enable forwarded headers); GET endpoints with idempotent writes not Origin-checked
