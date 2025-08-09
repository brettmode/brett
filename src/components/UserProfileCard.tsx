interface UserProfileCardProps {
  userInfo: {
    data: {
      userName: string;
      name: string;
      description: string;
      profilePicture: string;
      followers: number;
      following: number;
      location?: string;
      isBlueVerified?: boolean;
    };
  };
  thoughts: string;
}

export default function UserProfileCard({ userInfo, thoughts }: UserProfileCardProps) {
  const { userName, name, description, profilePicture, followers, following, location, isBlueVerified } = userInfo.data;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-3">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Profile Image */}
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
          <img 
            src={profilePicture} 
            alt={`${name} profile`}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <h3 className="text-white font-medium text-sm truncate">{name}</h3>
            {isBlueVerified && (
              <svg viewBox="0 0 24 24" fill="#1DA1F2" width="14" height="14">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
              </svg>
            )}
          </div>
          <p className="text-gray-300 text-xs">@{userName}</p>
        </div>

        {/* Open Button */}
        <div className="flex-shrink-0">
          <a
            href={`https://x.com/${userName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-white text-black rounded-full text-xs font-medium hover:bg-gray-100 transition-colors"
          >
            Open
          </a>
        </div>
      </div>

      {/* Bio */}
      {description && (
        <div className="mb-3">
          <p className="text-gray-200 text-xs leading-relaxed">{description}</p>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 mb-3 text-xs">
        <div>
          <span className="text-white font-medium">{formatNumber(following)}</span>
          <span className="text-gray-400 ml-1">Following</span>
        </div>
        <div>
          <span className="text-white font-medium">{formatNumber(followers)}</span>
          <span className="text-gray-400 ml-1">Followers</span>
        </div>
      </div>

      {/* Brett's Thoughts */}
      <div className="border-t border-white/10 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 rounded-full overflow-hidden">
            <img 
              src="/brett.png" 
              alt="Brett"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-gray-300 text-xs font-medium">Brett</span>
        </div>
        <div className="text-gray-300 text-xs font-medium mb-1">Brett's thoughts</div>
        <p className="text-gray-200 text-xs leading-relaxed">{thoughts}</p>
      </div>
    </div>
  );
}
