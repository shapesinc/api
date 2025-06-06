
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface PostCreateProps {
  onCreatePost: (title: string) => void;
}

const PostCreate: React.FC<PostCreateProps> = ({ onCreatePost }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreatePost(title);
      setTitle('');
    }
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 p-4 mb-4">
      <h2 className="text-lg font-medium mb-2">Create a post</h2>
      <form onSubmit={handleSubmit}>
        <Input
          placeholder="Ask a question..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-2"
        />
        <Button 
          type="submit" 
          disabled={!title.trim()}
          className="bg-reddit-orange hover:bg-orange-600 text-white"
        >
          Post
        </Button>
      </form>
    </div>
  );
};

export default PostCreate;
