# Next Character Preview Segment Plan

This plan outlines adding a second radio segment that previews the next character students will learn, building anticipation and providing a sneak peek of what's coming up.

## Overview

**Purpose:** Create excitement and anticipation for the next character to learn
**Target:** Character without a movie (using existing `getNextCharacterForMovie()` logic)
**Tone:** Teaser/preview style - mysterious, exciting, "coming up next" vibe

---

## Current System Analysis

### Existing Infrastructure We Can Reuse:
- ✅ `CharacterService.getNextCharacterWithoutMovie()` - perfect for our needs
- ✅ All radio generation services (TTS, Silence, Concat, DjScript)
- ✅ Character entity with all needed fields (character, pinyin, definition, radicals, actor, set)
- ✅ Existing caching and error handling patterns

### Key Difference from Hard Words Segment:
- **Hard Words:** Characters with movies (completed learning)
- **Next Character:** Character without movie (upcoming learning)

---

## Proposed Segment Structure

### "Coming Up Next" Segment Flow:
**Single AI-Generated Script** that includes:
1. **DJ Teaser Intro** - "But wait, there's more! Let me give you a sneak peek at what's coming up next..."
2. **Character Reveal** - "The character is... [Chinese character]"
3. **Mystery Definition** - "This character means... [definition]"
4. **Learning Elements Preview** - Actor, Set, Tone info as "clues"
5. **Call to Action** - "Ready to create a movie for this one? Let's make it memorable!"
6. **Outro** - "That's your preview - now get ready to learn!"

### Estimated Length: 30-45 seconds
**Key Change:** One cohesive AI-generated script with natural transitions, not separate pieces

---

## Implementation Plan

### Step 1: Create Next Character Query Service
```typescript
// services/nextCharacterQuery.service.ts
class NextCharacterQueryService {
  async getNextCharacterForPreview(): Promise<Character | null>
  // Reuses existing getNextCharacterWithoutMovie() logic
}
```

### Step 2: Extend DJ Script Service - **SINGLE SCRIPT METHOD**
```typescript
// Add to existing djScript.service.ts
class DjScriptService {
  async generateCompletePreviewScript(character: Character): Promise<string>
  // Generates ONE complete script for entire preview segment
  // Includes: intro, character reveal, definition, learning elements, call-to-action, outro
}
```

### Step 3: Create Preview Template Service
```typescript
// services/templatePreview.service.ts
class TemplatePreviewService {
  async buildPreviewSegments(): Promise<AudioSegment[]>
  // Creates segments: [AI Script] + [Chinese Character] + [Pauses]
  // Much simpler than hard words - just 3-4 segments total
}
```

### Step 4: Create Combined Radio Builder
```typescript
// services/radioBuilder.service.ts
class RadioBuilderService {
  async buildCompleteRadioShow(): Promise<AudioSegment[]>
  // Combines: Hard Words + Transition + Next Character Preview
}
```

### Step 5: Update CLI Script
```typescript
// buildCompleteRadio.ts (new file)
// Generates: hardwords.mp3 + preview.mp3 + complete-show.mp3
```

---

## Complete Script Generation Approach

### Single AI Prompt Strategy:
```typescript
const prompt = `You're a witty, engaging radio DJ wrapping up a Chinese learning segment.
Generate a complete "coming up next" preview script for the next character students will learn.

Character: ${character.character}
Pinyin: ${character.pinyin}
Definition: ${character.definition}
Actor: ${character.initialActor?.name}
Set: ${character.finalSet?.name}
Tone: ${toneNumber}
Radicals: ${radicals.join(', ')}

Create a 30-45 second script that:
1. Transitions from previous content ("But wait, there's more!")
2. Builds excitement about the upcoming character
3. Reveals the character and its meaning
4. Mentions the learning elements (actor, set, tone) as "clues"
5. Includes a call-to-action to create a movie
6. Ends with anticipation for learning

Keep it conversational, fun, and motivating. The Chinese character will be pronounced separately, so just say "The character is" and we'll insert the pronunciation.`;
```

### Benefits of Single Script Approach:
- ✅ **Natural Flow** - AI creates smooth transitions between sections
- ✅ **Cohesive Tone** - Consistent personality throughout
- ✅ **Simpler Implementation** - Fewer services and segments to manage
- ✅ **Better Caching** - One script per character, easier to cache
- ✅ **More Engaging** - AI can create better narrative arc

---

## Simplified Segment Structure

### Preview Segment Audio Flow:
1. **Complete AI DJ Script** (English) - 25-35 seconds
2. **Pause** - 500ms
3. **Chinese Character Pronunciation** (Chinese) - 2-3 seconds
4. **Final Pause** - 1s

**Total: ~30-40 seconds, only 4 audio segments**

---

## Technical Implementation Details

### File Structure:
```
server/src/radio/
├── services/
│   ├── nextCharacterQuery.service.ts     # NEW
│   ├── templatePreview.service.ts        # NEW (simplified)
│   ├── radioBuilder.service.ts           # NEW
│   ├── djScript.service.ts               # EXTEND (add generateCompletePreviewScript)
│   └── (existing services...)
├── buildCompleteRadio.ts                 # NEW
├── buildPreviewOnly.ts                   # NEW (for testing)
└── (existing files...)
```

### Output Files:
```
radio-output/
├── hardblock.mp3          # Existing hard words segment
├── preview.mp3            # NEW: Next character preview
└── complete-show.mp3      # NEW: Combined radio show
```

### Caching Strategy:
- **Single cache key per character** for complete preview script
- Much simpler than multiple cache keys for script pieces
- Preview segments cached by character ID

---

## Example Complete Script Output

```
"Alright language learners, before we wrap up, I've got something exciting coming up next!
Your next character challenge is going to be a fun one. The character is... [CHINESE PRONUNCIATION INSERTED HERE]...
and it means 'water'! Here's what I can tell you about this one - you'll be working with Jackie Chan
in the Kitchen, and it's a third tone, so get ready for that falling-rising sound.
The radicals involved are some interesting water-related elements.
Your mission? Create an unforgettable movie scene with Jackie in the kitchen involving water!
Time to put on your creative hat and make this character stick in your memory.
That's your sneak peek - now get ready to dive into your next Chinese adventure!"
```

---

## Success Criteria

### MVP Goals:
- ✅ Generate complete preview script for next character without movie
- ✅ Single cohesive AI-generated narrative with natural flow
- ✅ Include all character learning elements seamlessly
- ✅ Smooth integration with existing hard words segment
- ✅ Cached for performance

### Quality Metrics:
- Preview segment 30-45 seconds long
- Natural transitions and consistent DJ personality
- Clear call-to-action for movie creation
- No technical errors or audio glitches

---

## Next Steps

1. Create `nextCharacterQuery.service.ts`
2. Add `generateCompletePreviewScript()` method to `djScript.service.ts`
3. Build simplified `templatePreview.service.ts`
4. Test preview segment independently
5. Create combined radio builder
6. Update CLI scripts and module configuration

This simplified approach will create more engaging, natural-sounding preview segments while being easier to implement and maintain!
