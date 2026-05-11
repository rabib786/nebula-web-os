import { NextResponse } from 'next/server';

export async function GET(request: Request, props: { params: Promise<{ provider: string }> }) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const { provider } = await props.params;
  
  // ensure no trailing slash in APP_URL
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
  const redirectUri = `${appUrl}/api/auth/callback/${provider}`;
  
  let accessToken = '';

  try {
    if (provider === 'google') {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code || '',
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const data = await response.json();
      accessToken = data.access_token;
    } else if (provider === 'dropbox') {
      const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code || '',
          client_id: process.env.DROPBOX_CLIENT_ID || '',
          client_secret: process.env.DROPBOX_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const data = await response.json();
      accessToken = data.access_token;
    }
  } catch (err) {
    console.error(err);
  }

  return new NextResponse(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: '${provider}', token: '${accessToken}' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>Authentication successful. This window should close automatically.</p>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}
