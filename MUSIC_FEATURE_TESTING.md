# Music Feature Testing Checklist

## Prerequisites
- [ ] Spotify Developer account created
- [ ] App created in Spotify Dashboard
- [ ] Client ID and Client Secret copied to `.env` file
- [ ] Gemini API key configured in `.env` file
- [ ] Dependencies installed (`npm install`)

## Basic Functionality Tests

### 1. Spotify Authentication
- [ ] Test with valid credentials - should work
- [ ] Test with invalid/missing credentials - should gracefully fail with error message
- [ ] Verify token caching works (check console logs for "using cached token")
- [ ] Verify token refresh after expiration (wait ~60 minutes or mock)

### 2. Thought Planting with Music
- [ ] Plant a worry thought (e.g., "I'm anxious about tomorrow")
  - [ ] Gemini should suggest calming music
  - [ ] Spotify should return a matching track
  - [ ] Music player should appear in ReflectionModal
- [ ] Plant an idea thought (e.g., "I want to build a treehouse")
  - [ ] Should get uplifting/creative music suggestion
- [ ] Plant a goal thought (e.g., "I will run a marathon")
  - [ ] Should get motivational music
- [ ] Plant a memory thought (e.g., "Remember when we went to the beach")
  - [ ] Should get nostalgic/gentle music
- [ ] Plant a feeling thought (e.g., "I feel so happy today")
  - [ ] Should get joyful music

### 3. Music Player UI
- [ ] Album art displays correctly
- [ ] Song name and artist display correctly
- [ ] Reasoning text displays from Gemini
- [ ] Spotify embed player loads
- [ ] Embedded player can play the song preview
- [ ] "Open in Spotify" button works and opens correct track
- [ ] Player is responsive on mobile screens
- [ ] Player styling matches garden aesthetic

### 4. Edge Cases & Error Handling

#### Missing/Invalid Data
- [ ] Song not found on Spotify - thought should still save without music
- [ ] Gemini suggests obscure song - Spotify search returns closest match
- [ ] No album art available - player still displays without breaking
- [ ] No preview URL available - player shows but play button might not work
- [ ] Spotify API is down - thought saves without music, no crash

#### High Intensity Emotions
- [ ] High intensity worry (e.g., "I'm having a panic attack")
  - [ ] Gemini should suggest very calming/ambient music
  - [ ] Should NOT suggest intense or energetic music
- [ ] High intensity sadness (e.g., "I'm devastated")
  - [ ] Should suggest gentle, validating music
  - [ ] Should NOT suggest depressing music

#### Network Issues
- [ ] Slow Spotify API response - shows loading state
- [ ] Timeout on Spotify - thought saves without music
- [ ] Network disconnection during search - graceful failure

### 5. Existing Thoughts (Backward Compatibility)
- [ ] Old thoughts without music field display correctly
- [ ] Music section doesn't appear for old thoughts
- [ ] No errors in console for thoughts without music

### 6. Different Categories Mapping
Test that each category gets appropriate music mood:
- [ ] `todo` → productive/focused music
- [ ] `idea` → creative/inspirational music
- [ ] `worry` → calming/soothing music
- [ ] `feeling` → emotionally resonant music
- [ ] `goal` → motivational/uplifting music
- [ ] `memory` → nostalgic/gentle music
- [ ] `other` → neutral/ambient music

### 7. Performance
- [ ] Planting time with music is reasonable (< 3 seconds total)
- [ ] Loading toast shows "Finding your song..." during Spotify search
- [ ] Multiple plantings in succession don't cause token errors
- [ ] Token caching reduces API calls on subsequent plants

### 8. Visual Integration
- [ ] Music player appears in correct position (after next step, before growth log)
- [ ] Animation is smooth (fade in, scale)
- [ ] Colors match the garden aesthetic
- [ ] Gradients are subtle and calming
- [ ] Doesn't break modal scrolling

## Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Console Checks
- [ ] No errors in browser console
- [ ] No memory leaks after multiple plants
- [ ] Spotify API errors are logged with useful messages
- [ ] Token expiration is handled gracefully

## User Experience
- [ ] Music feels appropriate for the thought
- [ ] Reasoning text is meaningful and connects to emotion
- [ ] Player is intuitive to use
- [ ] External link clearly indicates it opens Spotify
- [ ] Feature feels integrated, not tacked on

## Known Limitations (Expected Behavior)
- Music requires Spotify credentials (documented in README)
- Preview might not be available for all tracks
- Requires internet connection for music search
- Gemini song suggestions might not always perfectly match available tracks

## Test Results Summary
Date Tested: _____________
Tested By: _____________
Environment: _____________

### Issues Found:
1. 
2. 
3. 

### Overall Status: ☐ Pass ☐ Fail ☐ Needs Improvement
