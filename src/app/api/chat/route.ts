import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, userName } = await request.json();
    
    // Get the base URL for internal API calls
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    const tools = [
      {
        type: "function" as const,
        function: {
          name: "fetch_user_tweets",
          description: "Fetch and analyze a user's latest tweets from Twitter",
          parameters: {
            type: "object",
            properties: {
              userName: {
                type: "string",
                description: "The Twitter username to fetch tweets for"
              },
              includeReplies: {
                type: "boolean",
                description: "Whether to include replies in the results"
              }
            },
            required: ["userName"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_user_profile",
          description: "Get detailed Twitter profile information for a user",
          parameters: {
            type: "object",
            properties: {
              userName: {
                type: "string",
                description: "The Twitter username to get profile info for"
              }
            },
            required: ["userName"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_user_mentions",
          description: "Get recent mentions of a user to understand engagement and conversations",
          parameters: {
            type: "object",
            properties: {
              userName: {
                type: "string",
                description: "The Twitter username to get mentions for"
              },
              sinceTime: {
                type: "integer",
                description: "Unix timestamp to get mentions since (optional)"
              },
              untilTime: {
                type: "integer",
                description: "Unix timestamp to get mentions until (optional)"
              }
            },
            required: ["userName"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "search_tweets",
          description: "Search for tweets using advanced search queries to find relevant conversations, trending topics, or content opportunities",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query (e.g., 'AI OR crypto', 'from:elonmusk', '#bitcoin since:2024-01-01')"
              },
              queryType: {
                type: "string",
                description: "Search type: 'Latest' for recent tweets or 'Top' for popular tweets",
                enum: ["Latest", "Top"]
              }
            },
            required: ["query"]
          }
        }
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are Brett, an autonomous Twitter agent powered by GPT-5. I specialize in helping users navigate and optimize their Twitter presence through real-time data analysis and strategic insights.

My capabilities include:
- Monitoring your Twitter mentions and engagement patterns
- Analyzing trending topics and conversations in your niche
- Crafting personalized tweets that match your voice and style
- Identifying growth opportunities and content strategies
- Providing real-time Twitter analytics and insights

I'm here to help you build meaningful connections, grow your audience, and stay on top of important conversations in your space. Whether you need help with content creation, engagement strategy, or understanding your Twitter analytics, I've got you covered.

When greeting users, introduce yourself naturally as an autonomous Twitter agent who can help them with their Twitter strategy and engagement. Be conversational, knowledgeable, and focus on practical value.

The current user's Twitter username is: ${userName || 'not provided'}`
        },
        {
          role: "user",
          content: message
        }
      ],
      tools: tools,
      tool_choice: "auto",
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0];
    
    // Check if the AI wants to call a function
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      const toolCall = response.message.tool_calls[0];
      if (toolCall.type === 'function') {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let functionResult = '';

        if (functionName === 'fetch_user_tweets') {
          try {
            console.log('🔍 Fetching tweets for:', functionArgs.userName);
            const tweetsResponse = await fetch(`${baseUrl}/api/twitter-tweets?userName=${functionArgs.userName}&includeReplies=${functionArgs.includeReplies || false}`);
            console.log('📡 Tweets response status:', tweetsResponse.status);
            
            if (tweetsResponse.ok) {
              const tweetsData = await tweetsResponse.json();
              
              if (tweetsData.data?.tweets && tweetsData.data.tweets.length > 0) {
                const tweets = tweetsData.data.tweets.slice(0, 5);
                console.log('✅ Found tweets, count:', tweets.length);
                
                // Return simple tweet data for AI analysis
                functionResult = JSON.stringify({
                  success: true,
                  tweets: tweets.map((tweet: any) => ({
                    text: tweet.text,
                    createdAt: tweet.createdAt,
                    likes: tweet.likeCount || 0,
                    retweets: tweet.retweetCount || 0,
                    replies: tweet.replyCount || 0,
                    views: tweet.viewCount || 0
                  }))
                });
              } else {
                console.log('❌ No tweets found in response');
                functionResult = JSON.stringify({ success: false, error: 'No tweets found' });
              }
            } else {
              functionResult = JSON.stringify({ success: false, error: 'Failed to fetch tweets' });
            }
          } catch (error) {
            functionResult = JSON.stringify({ success: false, error: 'API error' });
          }
        } else if (functionName === 'get_user_profile') {
          try {
            const profileResponse = await fetch(`${baseUrl}/api/twitter-user?userName=${functionArgs.userName}`);
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              functionResult = JSON.stringify(profileData);
            } else {
              functionResult = JSON.stringify({ success: false, error: 'Failed to fetch profile' });
            }
          } catch (error) {
            functionResult = JSON.stringify({ success: false, error: 'API error' });
          }
        } else if (functionName === 'get_user_mentions') {
          try {
            console.log('🔍 Fetching mentions for:', functionArgs.userName);
            const params = new URLSearchParams({
              userName: functionArgs.userName
            });
            
            if (functionArgs.sinceTime) params.append('sinceTime', functionArgs.sinceTime.toString());
            if (functionArgs.untilTime) params.append('untilTime', functionArgs.untilTime.toString());
            
            const mentionsResponse = await fetch(`${baseUrl}/api/twitter-mentions?${params.toString()}`);
            console.log('📡 Mentions response status:', mentionsResponse.status);
            
            if (mentionsResponse.ok) {
              const mentionsData = await mentionsResponse.json();
              
              if (mentionsData.tweets && mentionsData.tweets.length > 0) {
                const mentions = mentionsData.tweets.slice(0, 10);
                console.log('✅ Found mentions, count:', mentions.length);
                
                functionResult = JSON.stringify({
                  success: true,
                  displayType: 'mentions',
                  userName: functionArgs.userName,
                  mentions: mentions.map((mention: any) => ({
                    text: mention.text,
                    author: mention.author.name,
                    authorUsername: mention.author.userName,
                    profilePicture: mention.author.profilePicture,
                    createdAt: mention.createdAt,
                    likes: mention.likeCount || 0,
                    retweets: mention.retweetCount || 0,
                    replies: mention.replyCount || 0,
                    views: mention.viewCount || 0,
                    url: mention.url
                  }))
                });
              } else {
                console.log('❌ No mentions found in response');
                functionResult = JSON.stringify({ success: false, error: 'No mentions found' });
              }
            } else {
              functionResult = JSON.stringify({ success: false, error: 'Failed to fetch mentions' });
            }
          } catch (error) {
            functionResult = JSON.stringify({ success: false, error: 'API error' });
          }
        } else if (functionName === 'search_tweets') {
          try {
            console.log('🔍 Searching tweets with query:', functionArgs.query);
            const params = new URLSearchParams({
              query: functionArgs.query,
              queryType: functionArgs.queryType || 'Latest'
            });
            
            const searchResponse = await fetch(`${baseUrl}/api/twitter-search?${params.toString()}`);
            console.log('📡 Search response status:', searchResponse.status);
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              
              if (searchData.tweets && searchData.tweets.length > 0) {
                const tweets = searchData.tweets.slice(0, 10);
                console.log('✅ Found search results, count:', tweets.length);
                
                functionResult = JSON.stringify({
                  success: true,
                  displayType: 'searchResults',
                  query: functionArgs.query,
                  searchResults: tweets.map((tweet: any) => ({
                    text: tweet.text,
                    author: tweet.author.name,
                    authorUsername: tweet.author.userName,
                    profilePicture: tweet.author.profilePicture,
                    createdAt: tweet.createdAt,
                    likes: tweet.likeCount || 0,
                    retweets: tweet.retweetCount || 0,
                    replies: tweet.replyCount || 0,
                    views: tweet.viewCount || 0,
                    url: tweet.url
                  }))
                });
              } else {
                console.log('❌ No search results found');
                functionResult = JSON.stringify({ success: false, error: 'No search results found' });
              }
            } else {
              functionResult = JSON.stringify({ success: false, error: 'Failed to search tweets' });
            }
          } catch (error) {
            functionResult = JSON.stringify({ success: false, error: 'API error' });
          }
        }

        // Get the final response with the function result
        const finalCompletion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are Brett, a helpful AI agent. You just called a function and got results. Analyze the data and provide helpful, conversational insights. Answer the user's specific questions directly. Be natural and informative.`
            },
            {
              role: "user",
              content: message
            },
            {
              role: "assistant",
              content: null,
              tool_calls: response.message.tool_calls
            },
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: functionResult
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
          stream: true,
        });

        // Check if we have data to inject
        const parsedFunctionResult = JSON.parse(functionResult);
        const shouldInjectData = parsedFunctionResult.success && (parsedFunctionResult.displayType === 'tweets' || parsedFunctionResult.displayType === 'searchResults' || parsedFunctionResult.displayType === 'mentions');
        
        // Stream the response naturally
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              // If we have data to inject, inject it first
              if (shouldInjectData) {
                const dataMarker = `[TWEET_DATA]${functionResult}[/TWEET_DATA]`;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: dataMarker })}\n\n`));
                
                // Add a separator before the AI response
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '\n\n' })}\n\n`));
              }
              
              for await (const chunk of finalCompletion) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              }
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
    }

    // No function call needed, stream the regular response
    const streamCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are Brett, a helpful AI agent with access to Twitter data. You can fetch and analyze users' tweets and profile information. Be conversational and helpful. The current user's Twitter username is: ${userName || 'not provided'}`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamCompletion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
