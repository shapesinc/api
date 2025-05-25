
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CommentBoxProps {
  onSubmit: (comment: string) => void;
}

const CommentBox: React.FC<CommentBoxProps> = ({ onSubmit }) => {
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment);
      setComment('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="text-xs text-reddit-textgray mb-2">
        Comment as u/User
      </div>
      <Textarea
        placeholder="What are your thoughts?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mb-2"
        rows={4}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!comment.trim()}
          className="bg-reddit-orange hover:bg-orange-600 text-white"
        >
          Comment
        </Button>
      </div>
    </form>
  );
};

export default CommentBox;
