# Scene Overview Page — Implementation Plan

## 1. Page Structure & Layout
- **Header**
  - Back button (icon, similar to other navigation patterns)
  - Title: "Scene Overview"
- **Scene Card**
  - Scene image (thumbnail)
  - Scene title (e.g., "Pepp.3")
  - Stats: percent understood, new sentences count
  - Circular progress indicator for percent understood
- **Unique Characters Section**
  - Title: "Unique characters in this scene"
  - List of unique character tiles (with overflow/ellipsis if too many)
- **Sentence Gallery Section**
  - Title: "Sentence gallery"
  - List of sentence cards, each with:
    - Chinese sentence
    - Percent known
    - Status (e.g., "new")
- **Footer**
  - "Start Practice" button (full width, sticky to bottom if possible)

---

## 2. Component Structure & Reuse

### Main Component
- `scene-overview.component.ts/html/scss`: Main container for the page.

### Subcomponents & Patterns to Reuse
- **Character Tiles**
  - The `characters.component.html` uses a `.cell` and `.cell-content` pattern for character tiles.
  - Reuse this tile style for unique characters, but simplify (no click, no audio, just display).
- **Sentence Cards**
  - The `sentence-gallery.component.html` uses `.sentence-card` and `.sentence-content` for each sentence.
  - Reuse this card structure for the sentence gallery section.
- **Progress Indicators**
  - The `flashcards.component.html` and `sentence-gallery.component.html` both use progress bars.
  - For the circular progress, consider:
    - Using a library (e.g., `ng-circle-progress`)
    - Or, create a simple SVG-based circular progress component.
- **Buttons**
  - Use the `.btn`, `.btn-primary`, and `.btn-secondary` classes as in your current SCSS for consistency.
- **Sticky Footer**
  - Use a fixed or sticky footer pattern for the "Start Practice" button, as seen in mobile-friendly designs.

---

## 3. Styling & Theming
- **Colors:** Use soft backgrounds, white cards, orange for progress and buttons, black for text.
- **Typography:** Bold for titles, regular for details.
- **Spacing:** Generous padding/margin between sections and cards.
- **Rounded corners** for cards and tiles.
- **Responsive:** Mobile-first, but should look good on desktop.
- **SCSS:** Extend or reuse styles from `characters`, `sentence-gallery`, and `flashcards` components.

---

## 4. Data & State
- **Inputs/Props:**
  - Scene image URL
  - Scene title
  - Percent understood (number)
  - New sentences count (number)
  - Unique characters (array of strings)
  - Sentences (array of objects: { text, percentKnown, status })
- **Fetch or receive data via route resolver, service, or mock for now.**
- **Use the `MovieScene` model if available, or create a new interface for scene overview data.**

---

## 5. Functionality
- **Back button:** Navigates to previous page (use Angular router).
- **"Start Practice" button:** Navigates to practice route for this scene.
- **Ellipsis on unique characters:** Show only a few, with "..." if more exist.
- **Circular progress:** Animate or statically show percent understood/known.
- **Sentence cards:** Show percent known and status for each sentence.

---

## 6. Implementation Steps
1. Set up data model in the component (mock data for now).
2. Build the header with back button and title.
3. Create the scene card with image, title, stats, and circular progress.
4. Implement unique characters section with tiles and ellipsis.
5. Build the sentence gallery with styled cards for each sentence.
6. Add the sticky footer with the "Start Practice" button.
7. Style the page to match the mock (colors, spacing, fonts, etc.).
8. (Optional) Refactor into subcomponents for clarity.
9. Test responsiveness and polish UI.

---

## 7. Libraries/Dependencies
- Consider using a library for the circular progress indicator (e.g., [ng-circle-progress](https://www.npmjs.com/package/ng-circle-progress)), or implement a simple SVG-based one.

---

## 8. Best Practices from Existing Code
- Use Angular's `*ngFor`, `*ngIf`, and `[ngStyle]` for dynamic rendering and styling.
- Use service injection for data fetching (see `characters.component.ts` and `flashcards.component.ts`).
- Use SCSS for modular, reusable styles.
- Use standalone components or subcomponents for clarity and reusability.

---

## 9. Future Enhancements
- Connect to real data sources.
- Add loading and error states.
- Animate progress and transitions.
- Accessibility improvements.

---

**Next Steps:**
- Confirm this plan, then proceed to scaffold the UI and wire up mock data, reusing and adapting code as described above.
