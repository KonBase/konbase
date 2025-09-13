import { NextResponse } from 'next/server';
import { getUnifiedStorage } from '@/lib/storage/unified';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const storage = getUnifiedStorage();
    const storageType = storage.getStorageType();

    // For Vercel Blob, redirect to the actual URL
    if (storageType === 'vercel-blob') {
      const pathname = resolvedParams.path.join('/');
      const fileInfo = await storage.getFileInfo(pathname);

      if (!fileInfo) {
        return new NextResponse('File not found', { status: 404 });
      }

      // Redirect to the Vercel Blob URL
      return NextResponse.redirect(fileInfo.url);
    }

    // For local storage, serve the file directly
    const pathname = resolvedParams.path.join('/');
    const fileContent = await storage.getFileContent(pathname);

    if (!fileContent) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Get file info for content type
    const fileInfo = await storage.getFileInfo(pathname);
    const contentType = fileInfo?.contentType || 'application/octet-stream';

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileContent.length.toString());

    // Set cache headers for images
    if (contentType.startsWith('image/')) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      headers.set('Cache-Control', 'public, max-age=3600');
    }

    return new NextResponse(new Uint8Array(fileContent), {
      status: 200,
      headers,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
