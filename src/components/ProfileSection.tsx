"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import SuggestionBubbles from "./SuggestionBubbles";
import UserProfileCard from "./UserProfileCard";

export default function ProfileSection() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [messages, setMessages] = useState<Array<{id: number, message: string, isUser: boolean}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGeneratedWelcome, setHasGeneratedWelcome] = useState(false);
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [welcomeThoughts, setWelcomeThoughts] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Generate welcome message when user authenticates
  useEffect(() => {
    const generateWelcomeMessage = async () => {
      if (authenticated && user?.twitter?.username && !hasGeneratedWelcome) {
        setHasGeneratedWelcome(true);
        setIsLoading(true);

        try {
          // Fetch Twitter user info
          const twitterResponse = await fetch(`/api/twitter-user?userName=${user.twitter.username}`);
          
          if (twitterResponse.ok) {
            const userInfo = await twitterResponse.json();
            setUserProfileData(userInfo);
            
            // Generate personalized welcome message with streaming
            const welcomeResponse = await fetch('/api/welcome-message', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userInfo }),
            });

            if (welcomeResponse.ok && welcomeResponse.body) {
              const reader = welcomeResponse.body.getReader();
              const decoder = new TextDecoder();
              let thoughtsComplete = '';
              
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                      setWelcomeThoughts(thoughtsComplete);
                      setIsLoading(false);
                      return;
                    }
                    
                    try {
                      const parsed = JSON.parse(data);
                      if (parsed.content) {
                        thoughtsComplete += parsed.content;
                        setWelcomeThoughts(thoughtsComplete);
                      }
                    } catch (e) {
                      // Skip invalid JSON
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error generating welcome message:', error);
          // Fallback welcome message
          const fallbackMsg = {
            id: 1,
            message: `Hi @${user.twitter.username}! Welcome! I'm Brett, your AI assistant. How can I help you today?`,
            isUser: false
          };
          setMessages([fallbackMsg]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    generateWelcomeMessage();
  }, [authenticated, user?.twitter?.username, hasGeneratedWelcome]);

  // Handle Twitter login
  const handleTwitterLogin = () => {
    login();
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setMessages([]);
    setHasGeneratedWelcome(false);
    setUserProfileData(null);
    setWelcomeThoughts('');
  };

  const handleSendMessage = async (message: string) => {
    const newMessage = {
      id: messages.length + 1,
      message,
      isUser: true
    };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
    
    // Add empty AI message that will be updated with streaming content
    const aiMessageId = messages.length + 2;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          userName: user?.twitter?.username 
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiMessageAdded = false;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsLoading(false);
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  // Add AI message on first content chunk
                  if (!aiMessageAdded) {
                    const aiResponse = {
                      id: aiMessageId,
                      message: parsed.content,
                      isUser: false
                    };
                    setMessages(prev => [...prev, aiResponse]);
                    aiMessageAdded = true;
                    setIsLoading(false); // Stop showing loading indicator
                  } else {
                    // Update existing AI message
                    setMessages(prev => 
                      prev.map(msg => 
                        msg.id === aiMessageId 
                          ? { ...msg, message: msg.message + parsed.content }
                          : msg
                      )
                    );
                  }
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } else {
        const errorResponse = {
          id: aiMessageId,
          message: "Sorry, I'm having trouble responding right now. Please try again.",
          isUser: false
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, message: "Sorry, I'm having trouble responding right now. Please try again." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col relative">
      {/* Top Right - Connect Button */}
      <div className="absolute top-4 right-4 z-20">
        {!authenticated ? (
          <button 
            onClick={ready ? handleTwitterLogin : undefined}
            disabled={!ready}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {!ready ? "Loading..." : "Connect Twitter"}
            {ready && (
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-3 px-4 py-2 bg-white text-black rounded-full text-sm font-medium">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-300">
              {user?.twitter?.profilePictureUrl ? (
                <img 
                  src={user.twitter.profilePictureUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xs">
                  {user?.twitter?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <span>@{user?.twitter?.username || 'user'}</span>
            <button 
              onClick={handleLogout}
              className="ml-1 p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 384.971 384.971" fill="currentColor" width="12" height="12">
                <path d="M180.455,360.91H24.061V24.061h156.394c6.641,0,12.03-5.39,12.03-12.03s-5.39-12.03-12.03-12.03H12.03    C5.39,0.001,0,5.39,0,12.031V372.94c0,6.641,5.39,12.03,12.03,12.03h168.424c6.641,0,12.03-5.39,12.03-12.03    C192.485,366.299,187.095,360.91,180.455,360.91z"/>
                <path d="M381.481,184.088l-83.009-84.2c-4.704-4.752-12.319-4.74-17.011,0c-4.704,4.74-4.704,12.439,0,17.179l62.558,63.46H96.279    c-6.641,0-12.03,5.438-12.03,12.151c0,6.713,5.39,12.151,12.03,12.151h247.74l-62.558,63.46c-4.704,4.752-4.704,12.439,0,17.179    c4.704,4.752,12.319,4.752,17.011,0l82.997-84.2C386.113,196.588,386.161,188.756,381.481,184.088z"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Header Section */}
      <div className="flex-shrink-0 bg-[#101112] pt-6 pb-4 px-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src="/brett.png"
                  alt="Brett Profile Picture"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-gray-900"></div>
            </div>
          </div>
          <h1 className="text-sm font-medium text-white mb-1">
            Meet Brett - <a href="https://x.com/brettmode" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">Follow on X</a>
          </h1>
          <p className="text-gray-400 text-xs">An autonomous Twitter agent running on GPT-5</p>
        </div>
      </div>

      {/* Messages Container - Takes up remaining space */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 chat-scrollbar">
          <div className="max-w-3xl mx-auto">
            {!authenticated ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <p className="text-white text-sm text-center">
                  Please connect your Twitter first to talk with Brett
                </p>
              </div>
            ) : (
              <div className="space-y-6 py-8">
                {userProfileData && welcomeThoughts && (
                  <UserProfileCard 
                    userInfo={userProfileData} 
                    thoughts={welcomeThoughts} 
                  />
                )}
                
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg.message}
                    isUser={msg.isUser}
                  />
                ))}
                {isLoading && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src="/brett.png"
                        alt="Brett Profile Picture"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-300 text-base font-medium block mb-1">Brett</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 bg-[#101112] pt-2 pb-1">
          <div className="max-w-3xl mx-auto">
            {authenticated && (
              <SuggestionBubbles 
                onSuggestionClick={handleSendMessage} 
                isLoading={isLoading} 
              />
            )}
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} disabled={!authenticated} />
          </div>
        </div>
      </div>
    </div>
  );
}
