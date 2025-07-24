# SRT Import CLI Tool

A command-line tool to import SRT subtitle files into your language learning database.

## Usage

```bash
npm run scene-import <path-to-srt-file>
```

## Examples

```bash
# Import subtitles for scene 33
npm run scene-import ~/Downloads/33.srt

# Import from current directory
npm run scene-import ./subtitles/5.srt

# Import with full path
npm run scene-import /Users/alexosman/Downloads/1.srt
```

## File Naming Convention

Your SRT files **must** be named with the scene ID:

- ✅ `33.srt` → imports to scene ID 33
- ✅ `1.srt` → imports to scene ID 1
- ✅ `125.srt` → imports to scene ID 125
- ❌ `episode-33.srt` → invalid format
- ❌ `scene33.srt` → invalid format

## What it does

1. **Validates the file**: Checks filename format and file existence
2. **Extracts scene ID**: Gets the scene number from filename (e.g., `33.srt` → scene 33)
3. **Checks scene exists**: Verifies the scene exists in your database
4. **Duplicate protection**: Warns if sentences already exist and asks for confirmation
5. **Parses SRT content**: Extracts Chinese text and timestamps
6. **Imports to database**: Creates sentence records with proper scene association

## Interactive Features

- ⚠️ **Safety prompts**: Asks before overwriting existing sentences
- 📊 **Progress feedback**: Shows parsing and import statistics
- 📝 **Sample preview**: Displays first few imported sentences
- ❌ **Error handling**: Clear error messages for common issues

## Example Session

```bash
$ npm run scene-import ~/Downloads/33.srt

🚀 Starting SRT import...
📂 Processing file: 33.srt
🎬 Target scene ID: 33
✅ Scene found: "Hospital Visit"
📖 Reading SRT file...
📝 Parsed 25 subtitle entries
💾 Importing sentences to database...
✅ Successfully imported 25 sentences for scene 33
🎯 Scene: "Hospital Visit"
📊 Stats:
   - Entries parsed: 25
   - Sentences created: 25
📝 Sample sentences:
   1. [141s-149s] 我想当护士。
   2. [149s-152s] 我想当一位医生。那么，
   3. [152s-155s] 你呢？你想当什么？
   ... and 22 more
🎉 Import completed successfully!
```

## Error Handling

The tool provides helpful error messages:

- **File not found**: `File not found: ~/Downloads/missing.srt`
- **Wrong extension**: `File must have .srt extension`
- **Invalid filename**: `Invalid filename format. Expected: {sceneId}.srt`
- **Scene doesn't exist**: `Scene with ID 99 does not exist in database`
- **Invalid SRT content**: `No valid subtitle entries found in SRT file`

## Technical Notes

- Timestamps are converted to milliseconds and stored as `startMs`/`endMs`
- Sentences are linked to the scene ID from the filename
- Default spaced repetition values are set for new sentences
- Source is marked as `'SRT_IMPORT'` for tracking
- Empty subtitle entries are automatically skipped
- Multi-line subtitles are joined with spaces
