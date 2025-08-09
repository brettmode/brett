import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const queryType = searchParams.get('queryType') || 'Latest';
    const cursor = searchParams.get('cursor') || '';

    if (!query) {
      return NextResponse.json(
        { error: 'query parameter is required' },
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
      query: query,
      queryType: queryType,
      cursor: cursor
    });

    const url = `https://api.twitterapi.io/twitter/tweet/advanced_search?${params.toString()}`;
    
    console.log('🔍 Searching tweets with query:', query);
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
    console.log('✅ Search completed successfully, found tweets:', data.tweets?.length || 0);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error searching tweets:', error);
    return NextResponse.json(
      { error: 'Failed to search tweets' },
      { status: 500 }
    );
  }
}
