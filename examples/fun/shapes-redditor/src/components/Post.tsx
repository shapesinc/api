
import React from 'react';
import { ArrowUp, ArrowDown, MessageSquare, Share, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostProps {
  title: string;
  upvotes: number;
  onUpvote: () => void;
  onDownvote: () => void;
  timestamp: string;
}

const Post: React.FC<PostProps> = ({ 
  title, 
  upvotes, 
  onUpvote, 
  onDownvote,
  timestamp 
}) => {
  return (
    <div className="bg-white rounded-md border border-gray-200 mb-4">
      <div className="flex">
        {/* Vote arrows */}
        <div className="flex flex-col items-center pt-2 px-2 bg-gray-50">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-400 hover:text-reddit-orange hover:bg-transparent"
            onClick={onUpvote}
          >
            <ArrowUp size={20} />
          </Button>
          <span className="text-xs font-medium py-1">{upvotes}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-400 hover:text-blue-500 hover:bg-transparent"
            onClick={onDownvote}
          >
            <ArrowDown size={20} />
          </Button>
        </div>
        
        {/* Post content */}
        <div className="p-3 flex-1">
          <div className="text-xs text-reddit-textgray mb-2">
            Posted by u/User {timestamp}
          </div>
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-4 text-reddit-textgray text-xs">
            <button className="flex items-center hover:bg-gray-100 p-1 rounded">
              <MessageSquare size={16} className="mr-1" />
              Comments
            </button>
            <button className="flex items-center hover:bg-gray-100 p-1 rounded">
              <Share size={16} className="mr-1" />
              Share
            </button>
            <button className="flex items-center hover:bg-gray-100 p-1 rounded">
              <Bookmark size={16} className="mr-1" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;
