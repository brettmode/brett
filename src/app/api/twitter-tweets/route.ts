import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('userName');
    const cursor = searchParams.get('cursor') || '';
    const includeReplies = searchParams.get('includeReplies') === 'true';

    if (!userName) {
      return NextResponse.json(
        { error: 'userName parameter is required' },
        { status: 400 }
      );
    }

    const url = `https://api.twitterapi.io/twitter/user/last_tweets?userName=${userName}&cursor=${cursor}&includeReplies=${includeReplies}`;
    const options = {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.TWITTER_API_KEY!,
      },
    };

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Twitter tweets' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Twitter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
