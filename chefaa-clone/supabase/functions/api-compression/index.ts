// API Compression Edge Function
// Provides Gzip compression for API responses to reduce bandwidth
// Handles automatic compression negotiation with clients

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept-encoding',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Compress data using Gzip
async function compressGzip(data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(dataBuffer);
  writer.close();
  
  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  // Combine chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

interface CompressionRequest {
  data: any;
  compress?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const acceptEncoding = req.headers.get('accept-encoding') || '';
    const supportsGzip = acceptEncoding.includes('gzip');
    
    const body: CompressionRequest = await req.json();
    const { data, compress = true } = body;
    
    // Serialize data to JSON
    const jsonData = JSON.stringify(data);
    const originalSize = new TextEncoder().encode(jsonData).length;
    
    // Check if compression is supported and enabled
    if (compress && supportsGzip && originalSize > 1024) { // Only compress if > 1KB
      const compressed = await compressGzip(jsonData);
      const compressedSize = compressed.length;
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
      
      return new Response(compressed, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Encoding': 'gzip',
          'X-Original-Size': originalSize.toString(),
          'X-Compressed-Size': compressedSize.toString(),
          'X-Compression-Ratio': `${compressionRatio}%`,
          'Vary': 'Accept-Encoding',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      });
    }
    
    // Return uncompressed if compression not needed/supported
    return new Response(jsonData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Original-Size': originalSize.toString(),
        'X-Compression': 'none',
      },
    });
  } catch (error) {
    console.error('Compression error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
