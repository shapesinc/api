import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import PostCreate from '@/components/PostCreate';
import Post from '@/components/Post';
import CommentList, { CommentData } from '@/components/CommentList';
import CommentBox from '@/components/CommentBox';
import { getAIResponse } from '@/api/shapes';

const Index: React.FC = () => {
  const [post, setPost] = useState<{
    title: string;
    upvotes: number;
    timestamp: string;
  } | null>(null);

  const [comments, setComments] = useState<CommentData[]>([]);
  
  useEffect(() => {
    getAIResponse("", true); // Reset context on page load
  }, []);

  const handleCreatePost = (title: string) => {
    setPost({
      title,
      upvotes: 1, // Start with 1 upvote (self-upvote)
      timestamp: 'just now',
    });
    handleAIResponse(title);
  };
  
  const handleUpvotePost = () => {
    if (post) {
      setPost({
        ...post,
        upvotes: post.upvotes + 1,
      });
    }
  };
  
  const handleDownvotePost = () => {
    if (post) {
      setPost({
        ...post,
        upvotes: post.upvotes - 1,
      });
    }
  };
  
  const handleCommentSubmit = (content: string) => {
    const newComment: CommentData = {
      id: Date.now().toString(),
      author: 'u/User',
      content,
      timestamp: 'just now',
      upvotes: 1,
    };
    
    setComments([...comments, newComment]);
    
    // Simulate AI response after user comments
    handleAIResponse(newComment.content);
  };
  
  async function handleAIResponse(message: string) {
    const content = await getAIResponse(message);
    
    const aiComment: CommentData = {
      id: `ai-${Date.now()}`,
      author: 'u/otakufinalbossfellow',
      content,
      timestamp: 'just now',
      upvotes: 1,
      isAI: true,
    };

    setComments(prevComments => [...prevComments, aiComment]);
  }
  
  const handleUpvoteComment = (id: string) => {
    setComments(
      comments.map(comment => 
        comment.id === id ? { ...comment, upvotes: comment.upvotes + 1 } : comment
      )
    );
  };
  
  const handleDownvoteComment = (id: string) => {
    setComments(
      comments.map(comment => 
        comment.id === id ? { ...comment, upvotes: comment.upvotes - 1 } : comment
      )
    );
  };
  
  const handleReplyToComment = (content: string, parentId?: string) => {
    // For simplicity, we're just adding replies at the top level
    // In a real Reddit thread, replies would be nested
    handleCommentSubmit(content);
  };

  return (
    <div className="bg-reddit-gray min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">
        {!post ? (
          <PostCreate onCreatePost={handleCreatePost} />
        ) : (
          <div>
            <Post
              title={post.title}
              upvotes={post.upvotes}
              onUpvote={handleUpvotePost}
              onDownvote={handleDownvotePost}
              timestamp={post.timestamp}
            />
            
            <div className="bg-white rounded-md border border-gray-200 p-4">
              <CommentBox onSubmit={handleCommentSubmit} />
              
              <div className="border-t border-gray-200 pt-4">
                <CommentList
                  comments={comments}
                  onUpvote={handleUpvoteComment}
                  onDownvote={handleDownvoteComment}
                  onReply={handleReplyToComment}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
