
import React, { useState } from 'react';
import { ArrowUp, ArrowDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CommentProps {
  author: string;
  content: string;
  timestamp: string;
  upvotes: number;
  isAI?: boolean;
  onUpvote: () => void;
  onDownvote: () => void;
  onReply: (content: string) => void;
}

const Comment: React.FC<CommentProps> = ({
  author,
  content,
  timestamp,
  upvotes,
  isAI = false,
  onUpvote,
  onDownvote,
  onReply,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim()) {
      onReply(replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex">
        {/* Vote arrows */}
        <div className="flex flex-col items-center pt-1 pr-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-gray-400 hover:text-reddit-orange hover:bg-transparent"
            onClick={onUpvote}
          >
            <ArrowUp size={14} />
          </Button>
          <span className="text-xs font-medium py-1">{upvotes}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-gray-400 hover:text-blue-500 hover:bg-transparent"
            onClick={onDownvote}
          >
            <ArrowDown size={14} />
          </Button>
        </div>
        
        {/* Comment content */}
        <div className="flex-1">
          <div className="flex items-center">
            <span className={`text-xs font-medium ${isAI ? "text-reddit-orange" : "text-blue-500"}`}>{author}</span>
            <span className="text-xs text-reddit-textgray ml-2">{timestamp}</span>
          </div>
          <div className="text-sm my-1">{content}</div>
          
          {/* Comment actions */}
          <div className="flex items-center space-x-4 text-reddit-textgray text-xs">
            <button 
              className="flex items-center hover:bg-gray-100 p-1 rounded"
              onClick={() => setIsReplying(!isReplying)}
            >
              <MessageSquare size={14} className="mr-1" />
              Reply
            </button>
          </div>
          
          {/* Reply form */}
          {isReplying && (
            <form onSubmit={handleSubmitReply} className="mt-3">
              <Textarea
                placeholder="What are your thoughts?"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="mb-2 text-sm"
                rows={4}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReplying(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyContent.trim()}
                  className="bg-reddit-orange hover:bg-orange-600 text-white"
                >
                  Reply
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comment;
