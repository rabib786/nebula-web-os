import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const redirectUri = `${process.env.APP_URL}/api/auth/callback/${provider}`;

  let url = '';
  if (provider === 'google') {
    url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/drive.readonly&access_type=offline&prompt=consent`;
  } else if (provider === 'dropbox') {
    url = `https://www.dropbox.com/oauth2/authorize?client_id=${process.env.DROPBOX_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`;
  } else {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  return NextResponse.json({ url });
}
