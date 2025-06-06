
import React from 'react';
import Comment from './Comment';

export interface CommentData {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  upvotes: number;
  isAI?: boolean;
}

interface CommentListProps {
  comments: CommentData[];
  onUpvote: (id: string) => void;
  onDownvote: (id: string) => void;
  onReply: (content: string) => void;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  onUpvote,
  onDownvote,
  onReply,
}) => {
  if (comments.length === 0) {
    return <div className="text-sm text-reddit-textgray py-8 text-center">No comments yet</div>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Comment
          key={comment.id}
          author={comment.author}
          content={comment.content}
          timestamp={comment.timestamp}
          upvotes={comment.upvotes}
          isAI={comment.isAI}
          onUpvote={() => onUpvote(comment.id)}
          onDownvote={() => onDownvote(comment.id)}
          onReply={onReply}
        />
      ))}
    </div>
  );
};

export default CommentList;
