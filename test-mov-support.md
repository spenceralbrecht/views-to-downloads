# Testing MOV File Support

This document outlines how to test that MOV and other video formats are now supported in the frontend.

## Test Cases

### 1. File Input Accept Attribute Test
- **Test**: Try to select a MOV file using the file picker
- **Expected**: MOV files should appear in the file browser (they weren't selectable before)
- **Location**: Dashboard > Create > Demos section

### 2. JavaScript Validation Test
- **Test**: Upload a MOV file through the interface
- **Expected**: Should pass validation and begin upload process
- **Previous behavior**: Would show "Only MP4 video files are supported" error

### 3. Supported Formats
Test these formats should now work:
- `.mp4` (H.264/MPEG-4) ✅ 
- `.mov` (QuickTime) ✅ NEW
- `.avi` (Audio Video Interleave) ✅ NEW  
- `.mkv` (Matroska) ✅ NEW
- `.webm` (WebM) ✅ NEW
- `.wmv` (Windows Media Video) ✅ NEW
- `.flv` (Flash Video) ✅ NEW

### 4. Error Messages Test
- **Test**: Try uploading an unsupported format (e.g., .txt file)
- **Expected**: New error message should say "Supported video formats: MP4, MOV, AVI, MKV, WebM, WMV, FLV"
- **Previous behavior**: Would mention only MP4

### 5. UI Text Updates
- **Test**: Check the upload area text
- **Expected**: Should say "Multiple formats supported" instead of "MP4 format recommended"

## Backend Integration

The frontend changes work with the backend API that already supports these formats:
- `GET /api/supported-formats` - Returns current supported formats
- `POST /api/create-video` - Accepts all supported video formats

## MIME Types Supported

The frontend now validates these MIME types:
- `video/mp4`
- `video/quicktime` (MOV files)
- `video/x-msvideo` (AVI files)
- `video/x-matroska` (MKV files)
- `video/webm` (WebM files)
- `video/x-ms-wmv` (WMV files)
- `video/x-flv` (FLV files)

## Notes

1. All videos are converted to H.264/MP4 during backend processing for optimal compatibility
2. File size limit remains 100MB
3. The backend handles format conversion, so users can upload in their preferred format
4. MOV files from iPhone/Mac should now work seamlessly 