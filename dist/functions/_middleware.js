export function onRequest(context) {
  // Cloudflare Pages Functions middleware for SPA routing
  const url = new URL(context.request.url);
  
  // If the request is for a file that exists, serve it
  if (url.pathname !== '/' && !url.pathname.includes('.')) {
    // This is likely a client-side route, redirect to index.html
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/index.html'
      }
    });
  }
  
  // Continue with the request
  return context.next();
}
