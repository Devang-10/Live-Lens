import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import HighlightedText from './HighlightedText';
import { Send, MessageSquare, Bot } from 'lucide-react';
import { DbConnection } from '../module_bindings/index.ts';

export default function PostCard({ post, comments, onRefresh }) {
  const { user } = useContext(AuthContext);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const postId = post._id || post.id;
  const postComments = comments.filter(c => c.postId === postId || c.post_id === postId);
  
  let annotations = [];
  try {
    annotations = typeof post.annotationsJson === 'string' ? JSON.parse(post.annotationsJson) : (post.annotationsJson || []);
  } catch (e) {
    try {
      annotations = typeof post.annotations_json === 'string' ? JSON.parse(post.annotations_json) : (post.annotations_json || []);
    } catch(err) {}
  }

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const response = await fetch('http://localhost:3001/api/community/comment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          post_id: postId,
          content: newComment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      setNewComment('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const text = post.articleText || post.article_text || '';
  const author = post.authorUsername || post.author_username || 'Unknown';
  const timestamp = post.timestamp || '0';

  const dateStr = new Date(parseInt(timestamp)).toLocaleString();

  return (
    <div className="bg-white border text-left border-gray-100 rounded-3xl p-6 shadow-sm mb-6 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-gray-900 border-2 border-white shadow-sm ring-2 ring-gray-50 scale-100 transition-transform">
            {author.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{author}</h4>
            <p className="text-xs text-gray-500 font-medium">Posted at {dateStr}</p>
          </div>
        </div>
      </div>

      <article className="prose prose-lg max-w-none mb-6">
        <HighlightedText text={text} annotations={annotations} />
      </article>

      <div className="border-t border-gray-100 pt-4 mt-2">
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors px-3 py-2 -ml-3 rounded-xl hover:bg-gray-50"
        >
          <MessageSquare className="w-4 h-4" />
          {postComments.length} {postComments.length === 1 ? 'Comment' : 'Comments'}
        </button>

        {showComments && (
          <div className="mt-4 space-y-4 pl-2 border-l-2 border-yellow-200">
            {postComments.map((c, i) => {
              const cAuthor = c.authorUsername || c.author_username;
              const isBot = cAuthor === 'LiveLens Bot';
              
              return (
                <div 
                  key={i} 
                  className={`p-4 pt-3 rounded-2xl rounded-tl-none ${isBot ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {isBot && <Bot className="w-4 h-4 text-blue-500" />}
                    <span className={`font-semibold text-sm ${isBot ? 'text-blue-800' : 'text-gray-900'}`}>
                      {cAuthor}
                    </span>
                    {isBot && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest">Verified</span>}
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(parseInt(c.timestamp || '0')).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm ${isBot ? 'text-blue-900 font-medium leading-relaxed' : 'text-gray-700'}`}>
                    {c.content}
                  </p>
                </div>
              );
            })}

            {user ? (
              <form onSubmit={handleAddComment} className="flex items-center gap-2 mt-4 relative">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add your thoughts or corrections..."
                  className="flex-1 bg-white border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all pr-12"
                />
                <button 
                  type="submit" 
                  disabled={!newComment.trim()}
                  className="absolute right-1.5 p-2 bg-gray-900 text-white rounded-full disabled:bg-gray-200 disabled:text-gray-400 hover:bg-gray-800 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <p className="text-sm text-gray-500 italic mt-4 py-2">Sign in to add a comment.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
