import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('userName');
    const sinceTime = searchParams.get('sinceTime');
    const untilTime = searchParams.get('untilTime');
    const cursor = searchParams.get('cursor') || '';

    if (!userName) {
      return NextResponse.json(
        { error: 'userName parameter is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.TWITTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Twitter API key not configured' },
        { status: 500 }
      );
    }

    // Build query parameters
    const params = new URLSearchParams({
      userName: userName,
      cursor: cursor
    });

    if (sinceTime) params.append('sinceTime', sinceTime);
    if (untilTime) params.append('untilTime', untilTime);

    const url = `https://api.twitterapi.io/twitter/user/mentions?${params.toString()}`;
    
    console.log('🔍 Fetching mentions for:', userName);
    console.log('📡 API URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      console.error('❌ Twitter API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Twitter API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Mentions fetched successfully');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error fetching mentions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentions' },
      { status: 500 }
    );
  }
}
