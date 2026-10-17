import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const MAX_REQUEST_BYTES = 129 * 1024 * 1024;

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const origin = request.headers.get('origin');
  if (!['GET', 'HEAD'].includes(request.method) && origin) {
    try {
      if (new URL(origin).host !== request.headers.get('host')) throw new Error('origin');
    } catch {
      return NextResponse.json({ detail: 'Origin tidak diizinkan.' }, { status: 403 });
    }
  }
  if (Number(request.headers.get('content-length') || 0) > MAX_REQUEST_BYTES) {
    return NextResponse.json({ detail: 'Berkas maksimal 128 MiB.' }, { status: 413 });
  }
  const headers = new Headers();
  for (const key of ['content-type', 'cookie', 'origin']) {
    const value = request.headers.get(key); if (value) headers.set(key, value);
  }
  let tooLarge = false;
  try {
    let body: ReadableStream<Uint8Array> | undefined;
    if (!['GET', 'HEAD'].includes(request.method) && request.body) {
      const reader = request.body.getReader();
      let size = 0;
      body = new ReadableStream<Uint8Array>({
        async pull(controller) {
          const chunk = await reader.read();
          if (chunk.done) { controller.close(); return; }
          size += chunk.value.byteLength;
          if (size > MAX_REQUEST_BYTES) {
            tooLarge = true;
            await reader.cancel();
            controller.error(new Error('Upload too large'));
            return;
          }
          controller.enqueue(chunk.value);
        },
        cancel(reason) { return reader.cancel(reason); },
      });
    }
    const options: RequestInit & { duplex?: 'half' } = {
      method: request.method, headers, body, cache: 'no-store',
      signal: AbortSignal.timeout(300000), redirect: 'error', ...(body ? { duplex: 'half' as const } : {}),
    };
    const upstream = await fetch(`${process.env.API_URL || 'http://api:8000'}/api/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`, options);
    const output = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    for (const key of ['content-type', 'content-disposition']) {
      const value = upstream.headers.get(key); if (value) output.set(key, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) output.append('Set-Cookie', cookie);
    return new Response(upstream.body, { status: upstream.status, headers: output });
  } catch {
    return NextResponse.json({ detail: tooLarge ? 'Berkas maksimal 128 MiB.' : 'Layanan data belum terhubung atau melewati batas waktu. Periksa daftar dokumen sebelum mengulang unggahan.' }, { status: tooLarge ? 413 : 503 });
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
