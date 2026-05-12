import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  // Basic URL validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch (err) {
    return new NextResponse('Invalid URL provided', { status: 400 });
  }

  const requestUrl = new URL(request.url);
  const allowedOrigin = requestUrl.origin;

  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      cache: 'no-store',
      redirect: 'follow',
    });

    const contentType = res.headers.get('content-type') || '';
    
    // Only intercept HTML to rewrite it
    if (contentType.includes('text/html')) {
      let html = await res.text();
      const origin = parsedUrl.origin;
      
      // Inject <base> tag so relative paths (CSS, images) use the original site's origin.
      const baseTag = `<base href="${res.url}">`; // Use final url in case of redirects
      
      if (html.toLowerCase().includes('<head>')) {
        html = html.replace(/<head>/i, '<head>' + baseTag);
      } else {
        html = baseTag + html;
      }
      
      // Attempt to hijack link clicks to route back through the browser state
      // This is a naive injection, but it helps navigation work within our OS.
      const script = `
        <script>
          window.onload = function() {
            // Notify parent we actually loaded this URL (in case of redirects)
            window.parent.postMessage({ type: 'NEBULA_BROWSER_LOADED', url: '${res.url}' }, '*');

            document.body.addEventListener('click', function(e) {
              const a = e.target.closest('a');
              if (a && a.href) {
                e.preventDefault();
                window.parent.postMessage({ type: 'NEBULA_BROWSER_NAV', url: a.href }, '*');
              }
            });
            
            // Override form submissions as well (basic GET forms)
            document.body.addEventListener('submit', function(e) {
              const form = e.target;
              if (form && form.method.toLowerCase() === 'get') {
                e.preventDefault();
                const formData = new FormData(form);
                const params = new URLSearchParams(formData).toString();
                const action = form.action || window.location.href;
                const sep = action.includes('?') ? '&' : '?';
                window.parent.postMessage({ type: 'NEBULA_BROWSER_NAV', url: action + sep + params }, '*');
              }
            });
          };
        </script>
      `;
      
      if (html.toLowerCase().includes('</body>')) {
        html = html.replace(/<\/body>/i, script + '</body>');
      } else {
        html += script;
      }

      // We explicitly DO NOT return X-Frame-Options or Content-Security-Policy
      // effectively stripping them so the browser allows the iframe.
      return new NextResponse(html, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': allowedOrigin,
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // For non-HTML (if they directly link to an image via proxy)
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': allowedOrigin,
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error: any) {
    console.error('Proxy Fetch Error:', error.cause || error);
    const errorHtml = `
      <html>
        <head>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; color: #333; background: #f9fafb; text-align: center; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            h1 { color: #ef4444; margin-top: 0; }
            pre { background: #f3f4f6; padding: 1rem; border-radius: 4px; overflow-x: auto; text-align: left; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Site unreachable</h1>
            <p>The Nebula Proxy could not connect to <strong>${parsedUrl?.href || targetUrl}</strong></p>
            <pre>${error.message || String(error)}\n\nCause: ${error.cause?.message || String(error.cause || '')}</pre>
          </div>
        </body>
      </html>
    `;
    return new NextResponse(errorHtml, { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
