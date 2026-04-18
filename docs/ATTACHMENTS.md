# Transaction Attachments Feature

## Overview

The transaction attachments feature allows users to upload and manage receipts, invoices, and other supporting documents for both income and expense transactions. Files are stored securely in Supabase Storage with proper access controls.

## Implementation Summary

### Database Changes
**Migration:** `supabase/migrations/20260418_add_attachments.sql`

Added columns to `transactions` table:
- `attachment_url` (TEXT): Storage path to the file
- `attachment_name` (TEXT): Original filename
- `attachment_size` (INTEGER): File size in bytes
- `attachment_type` (TEXT): MIME type

### Storage Setup
**Migration:** `supabase/migrations/20260418_storage_setup.sql`

- Created `transaction-receipts` bucket in Supabase Storage
- Configured RLS policies for upload, read, update, and delete operations
- Bucket is private (requires signed URLs for access)

### File Support
**Supported Formats:**
- Images: JPG, JPEG, PNG, GIF, WEBP
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Maximum file size: 10MB

### New Files Created

1. **`lib/storage.ts`** - Storage utilities:
   - `uploadReceipt()` - Upload files to Supabase Storage
   - `deleteReceipt()` - Delete files from storage
   - `getSignedUrl()` - Generate temporary access URLs
   - `downloadReceipt()` - Download files
   - `validateFile()` - Client-side validation
   - `formatFileSize()` - Display helper
   - `getFileIcon()` - Icon helper

2. **`components/attachment-uploader.tsx`** - Upload component:
   - Drag-and-drop upload interface
   - File preview with name, size, and type
   - View, download, and delete actions
   - Inline error handling
   - Disabled state when transaction not saved

### Modified Files

1. **`lib/data.ts`**
   - Updated `Transaction` type with attachment fields

2. **`lib/services/api.ts`**
   - Updated `NewTransaction` and `UpdateTransaction` types
   - Added attachment fields to API mutations

3. **`app/api/transactions/route.ts`**
   - POST: Accept and store attachment metadata

4. **`app/api/transactions/[id]/route.ts`**
   - PATCH: Update attachment metadata
   - DELETE: (Future) Clean up orphaned files

5. **`components/edit-transaction-dialog.tsx`**
   - Added `AttachmentUploader` component
   - Made dialog scrollable for longer forms
   - Store attachment state

## Usage

### Upload Attachment
1. Create or edit a transaction
2. Transaction must be saved first (needs ID for storage path)
3. Click "Click to upload" or drag file
4. File is validated and uploaded to Supabase Storage
5. Metadata is saved with transaction

### View Attachment
- Click the eye icon to open in new tab (uses signed URL)
- Signed URLs are valid for 1 hour

### Download Attachment
- Click download icon to save file locally

### Delete Attachment
- Click X icon to remove
- Confirmation dialog appears
- File is deleted from storage and transaction metadata cleared

## Security

### Storage Policies
- Bucket is **private** (not publicly accessible)
- Access controlled via RLS policies
- Currently uses `anon` role (update for production with user-specific policies)

### File Validation
- Client-side: Type and size checks before upload
- Server-side: Additional validation recommended
- Unique file paths prevent overwrites (`transactionId/timestamp_filename`)

## Storage Structure

```
transaction-receipts/
├── {transactionId}/
│   ├── {timestamp}_receipt.pdf
│   ├── {timestamp}_invoice.jpg
│   └── ...
```

Each transaction gets its own folder for better organization.

## Future Enhancements

1. **Multiple attachments per transaction**
   - Create `transaction_attachments` junction table
   - Support uploading multiple receipts/invoices

2. **Image preview/thumbnails**
   - Generate thumbnails for images
   - Show inline preview instead of external link

3. **OCR integration**
   - Extract amount/date/vendor from receipts automatically
   - Pre-fill transaction form fields

4. **Attachment search**
   - Full-text search in attachment names
   - Filter transactions by "has attachment"

5. **Bulk operations**
   - Batch upload attachments
   - Export transactions with attachments as ZIP

6. **Storage optimization**
   - Image compression
   - Convert documents to PDF
   - Archive old attachments to cheaper storage

7. **User-specific storage**
   - Update RLS policies for authenticated users
   - Separate storage per organization/user

## Setup Instructions

### 1. Run Database Migrations

```sql
-- In Supabase SQL Editor, run:
\i supabase/migrations/20260418_add_attachments.sql
\i supabase/migrations/20260418_storage_setup.sql
```

Alternatively, via Supabase Dashboard:
1. Go to Database > SQL Editor
2. Copy and paste migration contents
3. Run query

### 2. Create Storage Bucket (if not auto-created)

Via Supabase Dashboard:
1. Go to Storage
2. Click "Create bucket"
3. Name: `transaction-receipts`
4. Public: **false** (unchecked)
5. Click "Create bucket"

### 3. Verify RLS Policies

Check that policies exist for `storage.objects`:
- Allow anon upload receipts
- Allow anon read receipts
- Allow anon delete receipts
- Allow anon update receipts

### 4. Test Upload

1. Create a transaction in the app
2. Edit the transaction
3. Upload a test file (PDF or image)
4. Verify file appears in Supabase Storage
5. Test view, download, and delete actions

## API Changes

### POST /api/transactions
**New optional fields:**
```typescript
{
  attachment_url?: string | null
  attachment_name?: string | null
  attachment_size?: number | null
  attachment_type?: string | null
}
```

### PATCH /api/transactions/[id]
**Same attachment fields as POST**

### Transaction Response
```typescript
{
  id: string
  // ... existing fields
  attachment_url?: string | null
  attachment_name?: string | null
  attachment_size?: number | null
  attachment_type?: string | null
}
```

## Troubleshooting

### Upload Fails
- Check Supabase Storage bucket exists
- Verify RLS policies are enabled
- Check file size (<10MB)
- Confirm file type is supported
- Check browser console for errors

### Cannot View Files
- Verify `getSignedUrl()` is working
- Check bucket is configured for signed URLs
- Ensure RLS policies allow SELECT

### Files Not Deleting
- Check RLS policy allows DELETE
- Verify correct file path format
- Look for orphaned files in Storage UI

## Performance Considerations

- Files are uploaded directly to Supabase Storage (no server roundtrip)
- Signed URLs cached for 1 hour (reduce API calls)
- File validation happens client-side first
- Storage operations are async (non-blocking UI)

## Cost Considerations

Supabase Storage pricing (as of 2024):
- 100GB free storage
- $0.021/GB after free tier
- $0.09/GB for egress

Recommendations:
- Implement file size limits (current: 10MB)
- Compress images before upload
- Archive old attachments
- Monitor storage usage

## Testing

### Manual Testing Checklist
- [ ] Upload small file (<1MB)
- [ ] Upload large file (close to 10MB)
- [ ] Upload all supported file types
- [ ] View attachment in new tab
- [ ] Download attachment
- [ ] Delete attachment
- [ ] Upload new file after deletion
- [ ] Edit transaction with existing attachment
- [ ] Save transaction without changes to attachment

### Edge Cases
- [ ] Upload before transaction is saved (should be disabled)
- [ ] Upload while another upload in progress
- [ ] Network failure during upload
- [ ] Invalid file type
- [ ] File too large
- [ ] Special characters in filename
- [ ] Very long filename

## Migration from Existing Data

If you have existing transactions without attachments:
1. No action needed - old transactions work fine
2. Attachment fields are nullable
3. UI gracefully handles missing attachments

## Conclusion

The attachments feature provides a complete solution for storing and managing transaction receipts. It's built on Supabase Storage for scalability and security, with a clean UI and comprehensive error handling.
