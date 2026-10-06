CREATE TABLE stage (
    code        TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    target_band REAL NOT NULL,
    sort_order  INTEGER NOT NULL
);

CREATE TABLE unit (
    code       TEXT PRIMARY KEY,
    stage_code TEXT NOT NULL REFERENCES stage (code),
    title      TEXT NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE profile (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    avatar        TEXT,
    pin_hash      TEXT,
    daily_minutes INTEGER NOT NULL DEFAULT 30,
    voice         TEXT,
    speech_rate   REAL NOT NULL DEFAULT 1.0,
    created_at    TEXT NOT NULL
);

CREATE TABLE word (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT NOT NULL,
    headword   TEXT NOT NULL,
    pos        TEXT NOT NULL,
    ipa_us     TEXT,
    ipa_uk     TEXT,
    meaning_vi TEXT NOT NULL,
    example_en TEXT,
    example_vi TEXT,
    cefr       TEXT,
    source     TEXT NOT NULL,
    profile_id INTEGER REFERENCES profile (id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX ux_word_global ON word (code) WHERE profile_id IS NULL;
CREATE UNIQUE INDEX ux_word_user ON word (profile_id, code) WHERE profile_id IS NOT NULL;

CREATE TABLE unit_word (
    unit_code  TEXT NOT NULL REFERENCES unit (code),
    word_id    INTEGER NOT NULL REFERENCES word (id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    PRIMARY KEY (unit_code, word_id)
);

CREATE TABLE lesson (
    code       TEXT PRIMARY KEY,
    unit_code  TEXT NOT NULL REFERENCES unit (code),
    type       TEXT NOT NULL,
    day        TEXT NOT NULL,
    title      TEXT NOT NULL,
    body_md    TEXT NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE test (
    code       TEXT PRIMARY KEY,
    kind       TEXT NOT NULL,
    unit_code  TEXT REFERENCES unit (code),
    stage_code TEXT REFERENCES stage (code),
    pass_ratio REAL NOT NULL
);

CREATE TABLE exercise (
    code           TEXT PRIMARY KEY,
    lesson_code    TEXT REFERENCES lesson (code),
    test_code      TEXT REFERENCES test (code),
    type           TEXT NOT NULL,
    prompt         TEXT NOT NULL,
    options_json   TEXT,
    answer         TEXT NOT NULL,
    explanation_vi TEXT,
    sort_order     INTEGER NOT NULL
);

CREATE TABLE card (
    profile_id    INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    word_id       INTEGER NOT NULL REFERENCES word (id) ON DELETE CASCADE,
    ease          REAL NOT NULL,
    interval_days INTEGER NOT NULL,
    repetitions   INTEGER NOT NULL,
    lapses        INTEGER NOT NULL,
    due_date      TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    PRIMARY KEY (profile_id, word_id)
);
CREATE INDEX ix_card_due ON card (profile_id, due_date);

CREATE TABLE review_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id    INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    word_id       INTEGER NOT NULL REFERENCES word (id) ON DELETE CASCADE,
    grade         TEXT NOT NULL,
    prev_interval INTEGER NOT NULL,
    new_interval  INTEGER NOT NULL,
    reviewed_at   TEXT NOT NULL
);
CREATE INDEX ix_review_log_profile ON review_log (profile_id, reviewed_at);

CREATE TABLE unit_progress (
    profile_id   INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    unit_code    TEXT NOT NULL REFERENCES unit (code),
    status       TEXT NOT NULL,
    started_at   TEXT,
    completed_at TEXT,
    PRIMARY KEY (profile_id, unit_code)
);

CREATE TABLE lesson_progress (
    profile_id   INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    lesson_code  TEXT NOT NULL REFERENCES lesson (code),
    score        REAL NOT NULL,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, lesson_code)
);

CREATE TABLE exercise_attempt (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id    INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    exercise_code TEXT NOT NULL,
    answer        TEXT,
    correct       INTEGER NOT NULL,
    attempted_at  TEXT NOT NULL
);

CREATE TABLE test_result (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    test_code  TEXT NOT NULL REFERENCES test (code),
    score      REAL NOT NULL,
    passed     INTEGER NOT NULL,
    taken_at   TEXT NOT NULL
);

CREATE TABLE study_session (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id  INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    study_date  TEXT NOT NULL,
    state_json  TEXT NOT NULL,
    started_at  TEXT NOT NULL,
    finished_at TEXT,
    minutes     INTEGER NOT NULL DEFAULT 0,
    UNIQUE (profile_id, study_date)
);
