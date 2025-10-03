import { handleUpload } from '@vercel/blob/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new Response('BLOB_READ_WRITE_TOKEN is not set', { status: 500 });
  }

  // Debug logging (safe subset)
  console.log('[UPLOAD ROUTE] Incoming request', {
    method: request.method,
    hasToken: !!token,
    ts: new Date().toISOString(),
  });

  // Try to handle explicit JSON events for robustness
  try {
    const body = (await request.clone().json().catch(() => null)) as Record<string, unknown> | null;
    if (body && typeof body === 'object' && 'type' in body) {
      console.log('[UPLOAD ROUTE] Received event', body);
      if (body.type === 'blob.generate-client-token') {
        console.log('[UPLOAD ROUTE] Returning client token');
        return new Response(
          JSON.stringify({ type: 'blob.generate-client-token', clientToken: token }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (body.type === 'blob.upload-completed') {
        console.log('[UPLOAD ROUTE] Upload completed event');
        return new Response(
          JSON.stringify({ type: 'blob.upload-completed', response: 'ok' }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
    }
  } catch {
    // fall through to handleUpload
  }

  // Delegate to Vercel Blob upload handler. Provide client token explicitly.
  const result = await (handleUpload as unknown as (
    args: {
      request: Request;
      onBeforeGenerateToken: () => Promise<{
        token: string;
        allowedContentTypes?: string[];
        maximumSizeInBytes?: number;
      }>;
      onUploadCompleted?: (args: unknown) => Promise<void> | void;
    }
  ) => Promise<Response | unknown>)({
    request,
    onBeforeGenerateToken: async () => ({
      token,
      allowedContentTypes: ["*/*"],
      maximumSizeInBytes: 200 * 1024 * 1024,
    }),
    onUploadCompleted: async (args: unknown) => {
      console.log('[UPLOAD ROUTE] onUploadCompleted', args);
    }
  });

  // Coerce possible non-Response results into JSON Response to satisfy Next.js types
  if (result instanceof Response) {
    return result;
  }
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}


