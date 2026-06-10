# Lesson 2 Website Tutor Product Spec

## Summary

Turn textbook lessons from reference pages into interactive tutor experiences. The first prototype lives at `/lessons/2/tutor`, preserves the current `/lessons/2` page, and uses Lesson 2 as the first high-quality vertical slice. Lesson 3 follows the same pattern at `/lessons/3/tutor`.

Primary source: `/Users/alexosman/Downloads/textbook.pdf`. Do not commit the PDF. Commit curated Lesson 2 source/extraction artifacts instead.

## Key Decisions

- First slice: Dialogue Tutor for Lesson 2.
- Second slice: Dialogue Tutor for Lesson 3.
- UI path: new route `/lessons/2/tutor`.
- Data strategy: fix/normalize Lesson 2 data before relying on it for richer interactions.
- Practice: deterministic drills, not AI-generated.
- Audio: existing browser speech synthesis.
- Personalization: browser-local `localStorage`.
- Verification: use Playwright MCP for visual and interaction checks.
- Git hygiene: ignore Playwright-generated screenshots/artifacts.

## Phased Plan

### Phase 1: Source Extraction and Data Cleanup

- Keep source PDF external at `/Users/alexosman/Downloads/textbook.pdf`.
- Use `pdf-parse` to extract Lesson 2 reference text.
- Maintain committed curated artifacts under `docs/textbook/`, starting with `lesson-2-source-extract.md` and `lesson-3-source-extract.md`.
- Include title/objectives, Dialogue I and II, vocab/proper nouns, and pattern references needed for tutor work.
- Clean the RDS-backed Lesson 2 data or normalize it in the app until the DB import is corrected:
  - missing vocab item `那`
  - mangled `高文中`
  - contaminated `白英爱`
  - merged POS/definition fields like `工作` and `大学生`
  - textbook ordering
- Acceptance: `GET /api/lessons/2` and `GET /api/lessons/3`, or the tutor's normalized lesson models, match the curated source artifacts.

### Phase 2: Repo Hygiene and Tooling

- Keep `pdf-parse` as a dependency for future textbook extraction work.
- Ignore Playwright MCP artifacts and generated screenshots/snapshots.
- Do not ignore app assets that are intentionally committed.
- Promote generated screenshots to docs only when they become deliberate design artifacts.

### Phase 3: Tutor Route Shell

- Add `/lessons/:lessonNumber/tutor`.
- For v1, support Lessons 2 and 3.
- Keep existing `/lessons/:lessonNumber` unchanged.
- Add a `Start Tutor` entry point from Lesson 2.
- Tutor modes: `Dialogue`, `Vocab`, `Patterns`, `My Family`, `Review`.
- Default mode: `Dialogue`.

### Phase 4: Dialogue Tutor Vertical Slice

- Build Dialogue I first and include Dialogue II as readable lesson content.
- Each line supports Chinese text, browser TTS playback, pinyin reveal, English reveal, character knowledge underlines, and the existing character hover tooltip.
- Add guided steps: listen through, reveal meaning line-by-line, identify key vocab, answer simple comprehension checks, and practice selected lines.
- Use deterministic answer checks.

### Phase 5: Pattern Practice

- Add Lesson 2 pattern modules for `有 / 没有`, possessive `的`, `几口人`, `谁 / 几 / 什么`, and `都`.
- Add Lesson 3 pattern modules for dates/time, age/birthday, alternative questions with `还是`, A-not-A questions, and `还`.
- Each module starts from real dialogue lines, then moves to drills.
- Drill types: choose missing word, build sentence from tiles, convert affirmative/negative, and answer family-size prompts.

### Phase 6: My Family Builder

- Store local personalization at `lessonTutor.familyProfile.v1.lesson2`.
- Capture family size, family members, and optional professions.
- Generate deterministic practice sentences such as `我家有四口人。`, `我爸爸是医生。`, `我有一个哥哥。`, and `我没有妹妹。`.
- Use generated sentences in practice/review.

## Public Interfaces and Data Changes

- New route: `/lessons/:lessonNumber/tutor`, supporting Lessons 2 and 3 in v1.
- Existing route remains: `/lessons/:lessonNumber`.
- Continue using `GET /api/lessons/:lessonNumber` and existing word seen/known endpoints.
- Add committed Lesson 2 source artifact under `docs/textbook/`.
- Add localStorage-only family profile for v1.
- No new backend API required for the first tutor prototype.

## Test and Verification Plan

- Data/API: verify Lesson 2 and Lesson 3 vocab ordering, proper nouns, POS, definitions, and dialogue groups against the curated artifacts.
- Angular: verify tutor route loads, pinyin/English reveal state works, TTS does not crash, deterministic drills score correctly, and My Family localStorage save/load works.
- Playwright MCP: open `/lessons/2/tutor` and `/lessons/3/tutor`, capture screenshots, step through Dialogue I, reveal pinyin and English, complete one drill, fill the personal practice builder, and verify generated sentences.
- Regression: `/lessons/2`, the Lessons tab, and existing vocab status toggles still work.

## Assumptions

- The textbook PDF remains outside the repo at `/Users/alexosman/Downloads/textbook.pdf`.
- We commit curated extraction artifacts, not the PDF itself.
- `pdf-parse` remains in the project.
- Playwright MCP is the preferred visual verification tool.
- Generated Playwright screenshots/snapshots are ignored unless intentionally promoted to design docs.
