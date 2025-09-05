import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getDataAccess } from '@/lib/db/data-access';
import { getUnifiedStorage } from '@/lib/storage/unified';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// POST /api/upload - Upload files with metadata tracking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const associationId = request.headers.get('x-association-id');
    if (!associationId) {
      return NextResponse.json({ error: 'Association ID required' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const itemId = formData.get('itemId') as string;
    const conventionId = formData.get('conventionId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Get unified storage
    const storage = getUnifiedStorage();
    const isStorageReady = await storage.isStorageReady();
    
    if (!isStorageReady) {
      return NextResponse.json(
        { error: 'Storage service is not available' },
        { status: 503 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${randomUUID()}.${fileExtension}`;
    
    // Determine upload directory based on file type
    let uploadDir = 'documents';
    if (file.type.startsWith('image/')) {
      uploadDir = itemId ? 'items' : 'images';
    }

    const pathname = `${uploadDir}/${associationId}/${fileName}`;

    // Upload file to unified storage
    const fileInfo = await storage.uploadFile({
      pathname,
      file,
      options: {
        access: 'public',
        contentType: file.type,
        cacheControlMaxAge: file.type.startsWith('image/') ? 31536000 : 3600, // Images cached for 1 year, others for 1 hour
      },
    });

    // Save file metadata to database using unified data access
    const dataAccess = getDataAccess();
    
    // For now, we'll store the file info in system settings since we don't have a documents table yet
    // In a real implementation, you'd want to add a documents table to your database schema
    const documentId = `doc_${randomUUID()}`;
    await dataAccess.setSystemSetting(`document:${documentId}`, JSON.stringify({
      id: documentId,
      association_id: associationId,
      name: name || file.name,
      description: description || null,
      file_path: pathname,
      file_url: fileInfo.url,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: session.user.email,
      item_id: itemId || null,
      convention_id: conventionId || null,
      uploaded_at: new Date().toISOString(),
    }));

    return NextResponse.json({
      data: {
        id: documentId,
        name: name || file.name,
        file_path: pathname,
        file_url: fileInfo.url,
        file_size: file.size,
        mime_type: file.type,
        url: fileInfo.url,
      },
      success: true,
      message: 'File uploaded successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', success: false },
      { status: 500 }
    );
  }
}
