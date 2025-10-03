import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function preview(value: string | undefined) {
  if (!value) return null;
  if (value.length <= 10) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function sha256(value: string | undefined) {
  if (!value) return null;
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function GET(): Promise<Response> {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
  const vercelUrl = process.env.VERCEL_URL || null;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  const nextPublicVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('NEXT_PUBLIC_') && typeof v === 'string') {
      nextPublicVars[k] = v;
    }
  }

  const body = {
    env,
    vercelUrl,
    timestamps: {
      server: new Date().toISOString(),
    },
    blob: {
      present: !!blobToken,
      preview: preview(blobToken),
      sha256: sha256(blobToken),
      length: blobToken ? blobToken.length : 0,
    },
    nextPublic: nextPublicVars,
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}


