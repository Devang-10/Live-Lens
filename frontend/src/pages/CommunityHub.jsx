import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { DbConnection } from '../module_bindings/index.ts';
import PostCard from '../components/PostCard';
import { Users, Loader2 } from 'lucide-react';

export default function CommunityHub() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/community/posts');
      if (res.ok) {
        const data = await res.json();
        const allPosts = data.posts || [];
        allPosts.sort((a, b) => parseInt(b.timestamp || '0') - parseInt(a.timestamp || '0'));
        setPosts(allPosts);
        
        const allComments = data.comments || [];
        allComments.sort((a, b) => parseInt(a.timestamp || '0') - parseInt(b.timestamp || '0'));
        setComments(allComments);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/community/post', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          article_text: newPostText
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit post');
      }

      setNewPostText('');
      fetchPosts(); // Refresh feed immediately
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-10">
      <div className="flex flex-col gap-4 text-center">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold uppercase mx-auto">
          <Users className="w-4 h-4" />
          Community Hub
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
          Discover & Discuss
        </h2>
        <p className="text-lg text-gray-500 font-light max-w-xl mx-auto">
          Read articles factor-checked by our AI and join discussions with the truth-seeking community.
        </p>
      </div>

      {user ? (
        <div className="bg-white border-2 border-yellow-100 p-6 rounded-3xl shadow-sm mb-4">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">Share an article</h3>
          {error && <div className="mb-4 text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          <form onSubmit={handleSubmitPost} className="flex flex-col gap-4">
            <textarea 
              value={newPostText}
              onChange={e => setNewPostText(e.target.value)}
              placeholder="Paste the article text here..."
              className="w-full min-h-[120px] p-4 text-gray-800 border border-gray-200 rounded-2xl resize-y focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all font-serif"
            />
            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={isSubmitting || !newPostText.trim()}
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-full font-medium transition-colors disabled:bg-gray-200 disabled:text-gray-400 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fact Check & Post'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-100 p-8 rounded-3xl text-center shadow-inner">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Join the conversation</h3>
          <p className="text-gray-500 mb-4">You must be logged in to post or comment.</p>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Latest Feed</h3>
        {posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>No articles have been shared yet. Be the first to start a conversation!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post._id || post.id} post={post} comments={comments} onRefresh={fetchPosts} />
          ))
        )}
      </div>
    </div>
  );
}
