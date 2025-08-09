import Image from "next/image";
import TweetList from "./TweetList";
import SearchResultsList from "./SearchResultsList";
import MentionsList from "./MentionsList";
import FormattedMessage from "./FormattedMessage";

interface ChatMessageProps {
  message: string;
  isUser?: boolean;
  timestamp?: string;
}

export default function ChatMessage({ message, isUser = false, timestamp }: ChatMessageProps) {
  // Check if the message contains tweet data
  const detectTweetData = (msg: string) => {
    try {
      // Look for tweet data markers in the message
      const tweetDataMatch = msg.match(/\[TWEET_DATA\]([\s\S]*?)\[\/TWEET_DATA\]/);
      if (tweetDataMatch) {
        const tweetData = JSON.parse(tweetDataMatch[1]);
        return tweetData;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const tweetData = detectTweetData(message);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`${isUser ? 'max-w-[70%]' : 'max-w-[85%]'} ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
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
              
              {/* Render tweet data if present */}
              {tweetData && tweetData.displayType === 'tweets' ? (
                <div className="space-y-4">
                  <p className="text-base leading-relaxed text-gray-100 mb-4">
                    Here are your latest tweets:
                  </p>
                  <TweetList tweets={tweetData.tweets} userName={tweetData.userName} />
                </div>
              ) : tweetData && tweetData.displayType === 'searchResults' ? (
                <div className="space-y-4">
                  <SearchResultsList results={tweetData.searchResults} query={tweetData.query} />
                </div>
              ) : tweetData && tweetData.displayType === 'mentions' ? (
                <div className="space-y-4">
                  <MentionsList mentions={tweetData.mentions} userName={tweetData.userName} />
                  {/* Show Brett's analysis after the mentions */}
                  {message.replace(/\[TWEET_DATA\][\s\S]*?\[\/TWEET_DATA\]/, '').trim() && (
                    <FormattedMessage message={message.replace(/\[TWEET_DATA\][\s\S]*?\[\/TWEET_DATA\]/, '').trim()} />
                  )}
                </div>
              ) : (
                <FormattedMessage message={message} />
              )}
            </div>
          </div>
        )}
        {isUser && (
          <div className="px-4 py-2 rounded-2xl" style={{ backgroundColor: '#323338' }}>
            <p className="text-base leading-normal text-white">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
