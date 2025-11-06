# Supabase Storage Setup - Delivery Photos

## ✅ Configuration Complete

### Storage Bucket
- **Bucket ID**: `delivery-photos`
- **Public**: Yes (public read access)
- **File Size Limit**: 5MB per file
- **Allowed MIME Types**: 
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`

### Storage Policies
1. **Upload Policy**: Authenticated users can upload photos to `deliveries/` folder
2. **View Policy**: Public read access to all photos in the bucket

### File Structure
Photos are stored with the following path structure:
```
delivery-photos/
  └── deliveries/
      └── {deliveryId}/
          └── {timestamp}-{index}.{ext}
```

Example: `deliveries/cl1234567890/1704123456789-0.jpg`

## Implementation Details

### API Route
- **File**: `src/app/api/warehouse/receive-delivery/route.ts`
- Uploads photos to Supabase Storage when receiving a delivery
- Saves photo metadata to `Media` table
- Uses service role key for upload (bypasses RLS)

### Frontend
- **Upload Form**: `src/app/warehouse/receive-delivery/[id]/ReceiveDeliveryForm.tsx`
  - Allows multiple photo uploads
  - Shows preview before submission
  - Supports removal of photos before upload

- **View Photos**: `src/app/client/deliveries/[id]/page.tsx`
  - Displays photos in a gallery grid
  - Click to enlarge (opens in new tab)
  - Fetches photos from `Media` table

## Usage

1. **Uploading Photos**:
   - Warehouse staff can upload photos when receiving a delivery
   - Photos are automatically uploaded to Supabase Storage
   - URLs are saved to the `Media` table linked to the delivery

2. **Viewing Photos**:
   - Clients can view photos on the delivery details page
   - Photos are displayed using public URLs from Supabase Storage
   - All photos are publicly accessible (bucket is set to public)

## Security Notes

- ⚠️ **Current Setup**: Bucket is public for easy viewing
- For production, consider:
  - Making bucket private
  - Implementing signed URLs with expiration
  - Adding user-specific access controls
  - Rate limiting uploads

## Environment Variables

Required Supabase environment variables (already set in `.env`):
```
NEXT_PUBLIC_SUPABASE_URL=https://wsguzrwyagbnynghfquu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Service role key is used for:
- Uploading files (requires authenticated access)
- Creating Media records in database

## Future Improvements

1. Image optimization/resizing before upload
2. Progress indicator for uploads
3. Image compression
4. Thumbnail generation
5. Signed URLs with expiration for better security
6. Delete functionality for uploaded photos

