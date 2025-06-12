import { serve } from "bun";
import index from "./src/index.html";
import tm7Viewer from "./src/tm7-viewer.html";
import path from 'node:path';

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
    "/assets/:filename": makeStaticAssetHandler('assets'),

    "/tm7-viewer": tm7Viewer,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

async function computeFileSha256(filename: string) {
  const hasher = new Bun.CryptoHasher('sha256');
  const file = Bun.file(filename);
  const stream: any = file.stream();
  for await (const chunk of stream) {
    hasher.update(chunk);
  }
  return hasher.digest('base64');
}

/**
 * A memoized function which computes the sha256 hash of a file.
 * In dev-mode, we'll recompute the hash on each request. In
 * production, we'll cache it.
 */
const getEtag = (() => {
  if (process.env.NODE_ENV === 'development') {
    return computeFileSha256;
  }
  const cache: Record<string, string> = {};
  return async (filename: string) => {
    let hash = cache[filename];
    if (!hash) {
      hash = await computeFileSha256(filename);
      cache[filename] = hash;
    }
    return hash;
  };
})();

function makeStaticAssetHandler(folderPath: string) {
  return async (req: Request & { params: Record<string, string> }) => {
    // Compute the full path, normalizing out any .. and . segments
    const requestPath = req.params.filename || '';
    const fullPath = path.normalize(path.join(folderPath, requestPath));
    // We've got an invalid request, possibly someone malicious hunting for files
    if (!fullPath.startsWith(folderPath)) {
      return new Response('Invalid asset path', { status: 403 });
    }
    // Handle the 404 edge-case
    const file = Bun.file(fullPath);
    if (!(await file.exists())) {
      return new Response('File not found', { status: 404 });
    }
    // Compute the etag and send a 304 if the client already has the latest
    const etag = await getEtag(fullPath);
    if (etag === req.headers.get('If-None-Match')) {
      return new Response(null, { status: 304 });
    }
    return new Response(file, { headers: { ETag: etag } });
  };
}
console.log(`🚀 Server running at ${server.url}`);