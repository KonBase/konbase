import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { geldb, executeQuery } from '@/lib/db/gel';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
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

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${randomUUID()}.${fileExtension}`;
    
    // Determine upload directory based on file type
    let uploadDir = 'documents';
    if (file.type.startsWith('image/')) {
      uploadDir = itemId ? 'items' : 'images';
    }

    const uploadPath = join(process.cwd(), 'uploads', uploadDir);
    const filePath = join(uploadPath, fileName);
    const relativePath = join('uploads', uploadDir, fileName);

    // Ensure upload directory exists
    await mkdir(uploadPath, { recursive: true });

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save file metadata to database
    const document = await geldb.querySingle(`
      INSERT INTO documents (
        association_id, name, description, file_path, 
        file_size, mime_type, uploaded_by, item_id, convention_id
      ) VALUES (
        <str>$1, <str>$2, <str>$3, <str>$4, <int>$5, <str>$6, <str>$7, <str>$8, <str>$9
      )
      RETURNING *
    `, [
      associationId,
      name || file.name,
      description || null,
      relativePath,
      file.size,
      file.type,
      session.user.email, // This should be user ID
      itemId || null,
      conventionId || null
    ]) as any;

    return NextResponse.json({
      data: {
        id: document.id,
        name: document.name,
        file_path: document.file_path,
        file_size: document.file_size,
        mime_type: document.mime_type,
        url: `/api/files/${document.id}`,
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
