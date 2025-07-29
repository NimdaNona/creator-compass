# Onboarding UI/UX Test Plan

## Overview
This document outlines the test cases for verifying that the onboarding flow UI/UX works correctly at each step.

## Test Cases

### 1. Welcome Step (Creator Level) - SINGLE SELECT
**Expected Behavior:**
- Shows 3 quick options: "Just Starting Out", "Some Experience", "Experienced Creator"
- Clicking an option immediately sends the message and proceeds to platform selection
- No submit button should appear

### 2. Platform Selection - SINGLE SELECT
**Expected Behavior:**
- Shows 3 quick options: YouTube, TikTok, Twitch
- Clicking an option immediately sends the message and proceeds to niche selection
- No submit button should appear
- Selected platform is stored in state

### 3. Content Niche - SINGLE SELECT
**Expected Behavior:**
- Shows content niche options: Gaming, Education, Lifestyle, Comedy, Tech, Other
- Clicking an option immediately sends the message and proceeds to equipment
- No submit button should appear
- Selected niche is stored in state

### 4. Equipment - MULTI SELECT
**Expected Behavior:**
- Shows equipment options with icons
- Clicking options toggles selection (highlighted when selected)
- Multiple items can be selected
- "Continue →" button appears on the right
- Clicking Continue sends "I have: [selected items]" message

### 5. Goals - MULTI SELECT
**Expected Behavior:**
- Shows goal options with icons
- Clicking options toggles selection (highlighted when selected)
- Multiple goals can be selected
- "Continue →" button appears on the right
- Clicking Continue sends "My goals are: [selected goals]" message

### 6. Time Commitment - SINGLE SELECT
**Expected Behavior:**
- Shows time commitment options: < 5 hours/week, 5-10, 10-20, 20-30, 30+
- Clicking an option immediately sends the message and proceeds to challenges
- No submit button should appear

### 7. Challenges - MULTI SELECT (NEWLY ADDED)
**Expected Behavior:**
- Shows challenge options with icons
- Clicking options toggles selection (highlighted when selected)
- Multiple challenges can be selected
- "Continue →" button appears on the right
- Clicking Continue sends "My challenges are: [selected challenges]" message

### 8. Completion Step
**Expected Behavior:**
- Quick options disappear
- Loading spinner stops
- "Start My Creator Journey" button appears at the bottom
- Button is clickable and navigates to dashboard
- Onboarding data is saved to database

## Key UI/UX Requirements

### Visual Feedback
- Selected options in multi-select steps should use 'default' variant (highlighted)
- Unselected options should use 'outline' variant
- Icons should appear next to each option
- Loading state should show spinner during AI response

### Flow Control
- No quick options should appear while AI is typing (isLoading = true)
- Quick options should update based on current step
- Completion detection should happen AFTER AI finishes response
- Error states should show clear error message

### Data Persistence
- All selections should be included in collectedResponses
- Platform and niche selections should update parent component state
- Onboarding data should save to UserAIProfile in database
- Progress object should be created with initial values

## Common Issues to Check

1. **"Start Journey" button not appearing**: 
   - Verify completion detection includes all possible phrases
   - Ensure isLoading is set to false
   - Check that currentStep is set to 'complete'

2. **Multi-select not working**:
   - Verify state arrays are initialized (equipment, goals, challenges)
   - Check that handleQuickOption returns early for multi-select
   - Ensure submit buttons call correct handlers

3. **Quick options appearing at wrong time**:
   - Check isLoading state during AI responses
   - Verify updateQuickOptions is called at right time
   - Ensure step transitions happen after AI completes

## Testing Checklist

- [ ] Start onboarding from fresh state
- [ ] Complete each step verifying expected behavior
- [ ] Test multi-select toggling (select/deselect)
- [ ] Verify all submit buttons work
- [ ] Check that completion shows "Start Journey" button
- [ ] Verify button navigates to dashboard
- [ ] Check database for saved onboarding data
- [ ] Test error recovery (network issues, etc.)
- [ ] Verify mobile responsiveness
- [ ] Test keyboard navigation (Enter key)

## Success Criteria

- All quick options behave as expected for their type (single/multi select)
- User can complete entire onboarding flow without confusion
- "Start My Creator Journey" button appears reliably
- All data is properly saved and persisted
- No UI glitches or unexpected behaviors