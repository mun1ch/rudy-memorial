export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
  const hasToken = Boolean(token);
  const tokenPreview = token ? `${token.slice(0, 8)}...${token.slice(-6)}` : null;
  const body = {
    env,
    hasToken,
    tokenPreview,
    timestamp: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}


