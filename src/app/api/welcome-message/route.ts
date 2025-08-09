import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userInfo } = await request.json();

    if (!userInfo || !userInfo.data) {
      return NextResponse.json(
        { error: 'User info is required' },
        { status: 400 }
      );
    }

    const { userName, name, description } = userInfo.data;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are Brett, a helpful AI agent. Generate a brief, friendly welcome message for a Twitter user. Focus only on their bio/description if available. Keep it short, conversational, and end with 'What's on your mind today?'"
        },
        {
          role: "user",
          content: `Generate a welcome message for @${userName}. ${description ? `Their bio says: "${description}"` : 'They have no bio.'} 
          
          Start with "Hi @${userName}!" and if they have an interesting bio, make a brief comment about it. Always end with "What's on your mind today?"`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
      stream: true,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
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
      { error: 'Failed to generate welcome message' },
      { status: 500 }
    );
  }
}
