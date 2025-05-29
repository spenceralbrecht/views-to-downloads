# TikTok Demo Video Submission Checklist

## Overview
Create a comprehensive screen recording (up to 3 MP4 files, max 50MB each) demonstrating the complete TikTok integration user experience as required by TikTok for app approval.

## Required Demo Flows

### 1. TikTok Authorization Flow
**Show the complete OAuth process:**
- [ ] User clicks "Connect TikTok Account" or similar button
- [ ] Redirect to TikTok's authorization page
- [ ] User grants permissions on TikTok's OAuth page
- [ ] Successful redirect back to your app
- [ ] Display of connected TikTok account information
- [ ] Show account selection UI if multiple accounts are connected

### 2. Export/Post-to-TikTok Page Navigation
**Demonstrate how users access the publishing feature:**
- [ ] Show navigation path to reach the "Post to TikTok" feature
- [ ] Display the video/content that will be published
- [ ] Show the "Publish to TikTok" button or modal trigger
- [ ] Demonstrate content preview functionality

### 3. Complete Post-to-TikTok User Flow
**Show every step of the publishing process:**

#### 3.1 Initial Setup & Account Display
- [ ] **Creator Info Display**: Show creator's nickname prominently (TikTok requirement)
- [ ] **Account Selection**: If multiple accounts, show selection interface
- [ ] **Content Preview**: Display video/photo preview that will be posted
- [ ] **Loading States**: Show "Loading settings..." when fetching creator info

#### 3.2 Required Form Fields (All Must Be Shown)
- [ ] **Title Field**: 
  - Show required asterisk (*)
  - Demonstrate entering a title
  - Show placeholder text
- [ ] **Privacy Setting**:
  - Show required asterisk (*)
  - Demonstrate dropdown with NO default value
  - Show manual selection of privacy level
  - If available, show options like: Public, Friends, Private, Followers
- [ ] **Interaction Settings**:
  - Show "Allow users to" section
  - Demonstrate Comment checkbox (manually unchecked by default)
  - For videos: Show Duet checkbox (manually unchecked by default)
  - For videos: Show Stitch checkbox (manually unchecked by default)
  - Show disabled/grayed out options if creator has them disabled

#### 3.3 Commercial Content Disclosure (Critical Section)
- [ ] **Disclosure Toggle**: 
  - Show "Disclose video content" switch in OFF position by default
  - Demonstrate turning the toggle ON
  - Show description text about promoting goods/services
- [ ] **Your Brand Option**:
  - Show the "Your brand" section with description
  - Demonstrate toggling it ON
  - Show the message: "Your photo/video will be labeled as 'Promotional content'"
- [ ] **Branded Content Option**:
  - Show the "Branded content" section with description
  - Demonstrate that it can be selected WITH "Your brand" (multiple selection)
  - Show the message: "Your photo/video will be labeled as 'Paid partnership'"
  - Demonstrate both options selected showing: "Your photo/video will be labeled as 'Paid partnership'"
- [ ] **Privacy Restriction Demo**:
  - Show that "Private" option is disabled when "Branded content" is selected
  - Display tooltip: "Branded content visibility cannot be set to private"
- [ ] **Validation Demo**:
  - Show publish button disabled when disclosure is ON but no options selected
  - Show tooltip: "You need to indicate if your content promotes yourself, a third party, or both"

#### 3.4 Compliance Messages
- [ ] **Music Usage Only**: Show message when no branded content selected
- [ ] **Branded Content Policy**: Show additional policy message when branded content selected
- [ ] **Links**: Demonstrate that policy links are clickable and functional

#### 3.5 Publishing Process
- [ ] **Validation**: Show form validation for required fields
- [ ] **Publish Button**: Demonstrate clicking "Publish to TikTok"
- [ ] **Loading State**: Show "Publishing..." state with spinner
- [ ] **Success State**: Show success message and any returned TikTok URL
- [ ] **Error Handling**: If possible, show error state (optional but recommended)

#### 3.6 Post-Publication
- [ ] **Status Update**: Show that user is informed content may take time to process
- [ ] **Profile Visibility**: Mention that content will appear on TikTok profile
- [ ] **Modal Closure**: Show user can close modal after successful publish

## Technical Requirements to Highlight

### Creator Info API Usage
- [ ] Show that creator info is fetched and displayed
- [ ] Demonstrate privacy options come from API response
- [ ] Show interaction settings respect creator's disabled features

### User Control & Awareness
- [ ] **Full Control**: User must explicitly confirm every setting
- [ ] **No Defaults**: Demonstrate no pre-selected privacy or interaction settings
- [ ] **Preview**: Show complete content preview before publishing
- [ ] **Manual Consent**: Show user explicitly clicks publish after reviewing all settings

### Error Prevention
- [ ] **Required Field Validation**: Show asterisks and validation messages
- [ ] **Disclosure Logic**: Show proper validation of commercial content settings
- [ ] **Privacy Restrictions**: Show branded content privacy limitations

## Recording Quality Requirements

### Technical Specs
- [ ] MP4 format, max 50MB per file
- [ ] Clear screen resolution (1080p recommended)
- [ ] Stable recording without excessive mouse movement
- [ ] Audio narration explaining each step (recommended)

### Content Guidelines
- [ ] Show real data, not placeholder content
- [ ] Use actual TikTok account (can be test account)
- [ ] Demonstrate with realistic video/photo content
- [ ] Show complete flow without cuts or jumps
- [ ] Include loading states and transitions

## Submission Strategy

### Video Organization
1. **Video 1**: TikTok Authorization + Account Selection
2. **Video 2**: Navigation to Post Feature + Form Completion
3. **Video 3**: Commercial Disclosure + Publishing Process

### Key Success Factors
- [ ] **Completeness**: Every required element must be visible
- [ ] **Compliance**: All UX requirements from guidelines demonstrated
- [ ] **User Experience**: Smooth, intuitive flow
- [ ] **Real Usage**: Actual posting to TikTok (not just simulation)

## Critical Checkpoints

### Before Recording
- [ ] Ensure all compliance fixes are deployed
- [ ] Test complete flow multiple times
- [ ] Verify all required elements are present
- [ ] Prepare test content for posting

### During Recording
- [ ] Go slowly and clearly through each step
- [ ] Highlight required fields and validation
- [ ] Show tooltips and error messages
- [ ] Demonstrate multiple selection for disclosure options

### After Recording
- [ ] Review against this checklist
- [ ] Verify all TikTok requirements are covered
- [ ] Check file sizes are under 50MB
- [ ] Test video playback quality

## Notes
- Focus on showing TikTok's specific requirements about commercial content disclosure
- Emphasize multiple selection capability for brand/branded content
- Show proper privacy restrictions and validation
- Demonstrate user control and manual selection of all settings
- Include real posting to TikTok, not just UI demonstration 