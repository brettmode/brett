"use client";

import TweetCard from "./TweetCard";

interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  viewCount?: number;
  author: {
    name: string;
    userName: string;
    profilePicture: string;
    isVerified?: boolean;
    isBlueVerified?: boolean;
  };
  extendedEntities?: {
    media?: Array<{
      media_url_https: string;
      type: string;
      url: string;
    }>;
  };
}

interface TweetListProps {
  tweets: Tweet[];
  userName: string;
}

export default function TweetList({ tweets, userName }: TweetListProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          Latest tweets from @{userName}
        </h3>
        <p className="text-gray-400 text-sm">
          {tweets.length} recent {tweets.length === 1 ? 'tweet' : 'tweets'}
        </p>
      </div>
      
      {tweets.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
    </div>
  );
}
