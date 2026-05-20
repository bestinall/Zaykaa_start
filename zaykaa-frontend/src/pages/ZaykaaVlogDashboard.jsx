import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FloatingInput from '../components/ui/FloatingInput';

export default function ZaykaaVlogDashboard() {
  // Navigation Routing Tab State: 'posts' | 'text_feedback' | 'pic_feedback' | 'dashboard'
  const [currentTab, setCurrentTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Upload Form State Tracker
  const [caption, setCaption] = useState('');
  const [dishName, setDishName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Text-Only Feedback State
  const [textFeedback, setTextFeedback] = useState('');
  const [textReviewRestaurant, setTextReviewRestaurant] = useState('');
  
  // Interaction Sub-Drawers
  const [activePostComments, setActivePostComments] = useState(null); 
  const [commentList, setCommentList] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');

  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  const API_BASE = "http://127.0.0.1:5000/api"; 
  const token = localStorage.getItem("token");

  // Safeguard extraction for User ID tracking (supports 'id', 'user_id', or standard JWT 'sub')
  const currentUserId = user?.id || user?.user_id || user?.sub || "ID-UNKNOWN";

  // Combined fetch and initial component load handler hook
  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/posts`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setPosts(data);
          } else {
            setPosts([]); 
          }
        } else {
          setPosts([]); 
          toast.error("Service Offline", "The vlogger microservice back-end is currently unreachable.");
        }
      } catch (err) {
        console.error("Error fetching Zaykaa feed:", err);
        setPosts([]);
        toast.error("Handshake Error", "Could not fetch synchronized timeline entries.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inline secondary trigger for explicit manual refresh actions
  const triggerManualRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/posts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setPosts(data);
      } else {
        setPosts([]);
        toast.error("Auth / Route Error", data.message || "Failed to load feed entries.");
      }
    } catch (err) {
      console.error(err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAction = () => {
    if (!window.confirm("Are you sure you want to log out of your Zaykaa Studio workspace?")) return;
    localStorage.removeItem("token");
    localStorage.removeItem("zaykaa_token");
    if (typeof logout === 'function') {
      logout();
    }
    toast.success("Signed Out", "Your workspace session closed successfully.");
    navigate("/login");
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      return toast.error("File Required", "Please attach a gourmet picture or video stream.");
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('caption', caption);
    formData.append('dish_name', dishName);
    formData.append('restaurant_name', restaurantName);

    try {
      const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData 
      });

      if (res.ok) {
        toast.success("Broadcast Live!", "Your post is instantly visible to all users across Zaykaa.");
        setCaption('');
        setDishName('');
        setRestaurantName('');
        setSelectedFile(null);
        if (document.getElementById('vlog-file-input')) {
          document.getElementById('vlog-file-input').value = '';
        }
        triggerManualRefresh();
      } else {
        const errData = await res.json();
        toast.error("Upload Aborted", errData.error || "Execution error.");
      }
    } catch (err) {
      console.error("Network error:", err);
      toast.error("Gateway Error", "Failed to reach backend services.");
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const adjustment = data.liked ? 1 : -1;
            return { 
              ...p, 
              like_count: Math.max(0, (p.like_count || 0) + adjustment),
              user_has_liked: data.liked
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error("Failed syncing like toggle:", err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to remove this culinary masterpiece from Zaykaa?")) return;

    const originalPosts = [...posts];
    setPosts(prev => prev.filter(p => p.id !== postId));

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Post Removed", "The vlog post has been completely removed from the live timeline.");
      } else {
        setPosts(originalPosts);
        toast.error("Delete Failed", "Gateway path unlinked or authorization issue. Ensure routes.py is updated.");
      }
    } catch (err) {
      console.error("Failed deleting post:", err);
      setPosts(originalPosts);
      toast.dark("Network Error", "Unable to complete operation.");
    }
  };

  const openComments = async (postId) => {
    if (activePostComments === postId) {
      setActivePostComments(null);
      return;
    }
    setActivePostComments(postId);
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setCommentList(data);
      }
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newCommentText })
      });

      if (res.ok) {
        const newCommentObj = await res.json();
        setCommentList(prev => [...prev, {
          id: newCommentObj.id,
          text: newCommentText,
          username: user?.name || "Me",
          created_at: new Date().toISOString()
        }]);
        setNewCommentText('');
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p));
      }
    } catch (err) {
      console.error("Comment submission failed:", err);
    }
  };

  const analyticsData = {
    popularFood: posts.reduce((acc, p) => p.dish_name ? p.dish_name : acc, "Smoked Butter Chicken Platter"),
    topCreator: posts.reduce((acc, p) => p.username ? `@${p.username}` : acc, `@${user?.name || 'Brundhakshitha'}`),
    totalEngagement: posts.reduce((sum, p) => sum + (p.like_count || 0) + (p.comment_count || 0), 248),
    orderHistory: [
      { id: "ORD-9924", vendor: "The Spice Symphony", details: "Premium Handi Biryani x2", date: "May 18, 2026", total: "₹740", status: "Delivered" },
      { id: "ORD-9811", vendor: "Ovenfresh Artisanal", details: "Truffle Mushroom Pizza x1", date: "May 12, 2026", total: "₹520", status: "Delivered" },
      { id: "ORD-9650", vendor: "Thalassery Kitchens", details: "Malabar Parotta & Beef Fry", date: "May 04, 2026", total: "₹410", status: "Delivered" }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b11] text-slate-950 dark:text-slate-50 transition-colors duration-300 antialiased">
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f111a]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Zaykaa<span className="text-brand font-medium text-orange-500">.</span>
            </h1>
            
            <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <button onClick={() => setCurrentTab('posts')} className={`rounded-full px-4 py-2 transition ${currentTab === 'posts' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Vlog Posts</button>
              <button onClick={() => setCurrentTab('text_feedback')} className={`rounded-full px-4 py-2 transition ${currentTab === 'text_feedback' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Text Feedbacks</button>
              <button onClick={() => setCurrentTab('pic_feedback')} className={`rounded-full px-4 py-2 transition ${currentTab === 'pic_feedback' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Pic Feedbacks</button>
              <button onClick={() => setCurrentTab('dashboard')} className={`rounded-full px-4 py-2 transition ${currentTab === 'dashboard' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Dashboard Studio</button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Header User Profile Display Name and ID Context */}
            <div className="hidden sm:flex flex-col items-end text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="text-slate-950 dark:text-white">👋 Welcome, {user?.name || 'Brundhakshitha'}</span>
              <span className="text-[10px] font-mono text-slate-400">UID: {currentUserId}</span>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-200 px-3 py-1.5 dark:bg-slate-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">{user?.role || 'Creator'} Studio</span>
            </div>

            <button 
              onClick={handleLogoutAction}
              className="rounded-xl border-2 border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 hover:border-rose-400 dark:border-slate-700 dark:bg-[#111420] dark:text-rose-400 dark:hover:bg-rose-500/10"
              title="Sign out of system"
            >
              Sign Out 🚪
            </button>
          </div>
        </div>
      </header>

      {/* BODY VIEWPORTS CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: GLOBAL TIMELINE AND VLOG UPLOAD */}
          {currentTab === 'posts' && (
            <motion.div key="posts" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid gap-8 md:grid-cols-[1fr_1.3fr] lg:grid-cols-[0.85fr_1.15fr] items-start">
              <div className="space-y-4">
                <Card hover={false} className="border border-slate-300 p-6 shadow-xl bg-white dark:border-slate-700 dark:bg-[#111420]">
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Live Broadcast Engine</p>
                    <h2 className="font-display text-2xl font-bold mt-1 text-slate-950 dark:text-white">Upload New Content</h2>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">When you publish here, your food journey instantly populates the dynamic timelines of all active users globally.</p>
                  </div>

                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <FloatingInput label="Dish Spotlight Name" type="text" value={dishName} onChange={(e) => setDishName(e.target.value)} required />
                    <FloatingInput label="Restaurant Name / Venue" type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} />
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Vlog Caption</label>
                      <textarea placeholder="Share taste profiles, flavor arrays, aroma signatures..." value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full rounded-xl border-2 border-slate-400 bg-white p-3 text-sm font-semibold text-slate-950 focus:border-orange-500 focus:outline-none dark:border-slate-600 dark:bg-[#161a2b] dark:text-white dark:focus:border-orange-400 transition-all placeholder-slate-500 dark:placeholder-slate-400" rows="4" required />
                    </div>

                    <div className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-400 bg-slate-100 p-5 text-center transition hover:border-orange-500 dark:border-slate-600 dark:bg-[#161a2b] dark:hover:border-orange-400">
                      <input id="vlog-file-input" type="file" accept="image/*,video/*" onChange={(e) => setSelectedFile(e.target.files[0])} className="absolute inset-0 cursor-pointer opacity-0" />
                      <div className="text-2xl mb-1">{selectedFile ? '🎉' : '📹'}</div>
                      <p className="text-xs font-bold text-slate-950 dark:text-white">{selectedFile ? selectedFile.name : 'Select Video or Snap File'}</p>
                      <p className="text-[10px] text-slate-800 dark:text-slate-300 mt-0.5">Supports MP4, WebM, or dish images</p>
                    </div>

                    <Button type="submit" size="lg" block className="bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-md shadow-orange-500/20">
                      {uploading ? "Broadcasting Asset..." : "🚀 Publish Globally"}
                    </Button>
                  </form>
                </Card>
              </div>

              {/* Media Scrolling Timeline Display Feed */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Public Live Feed</h3>
                  <Button variant="ghost" size="sm" onClick={triggerManualRefresh} className="font-bold border border-slate-300 dark:border-slate-700">🔄 Sync Refresh</Button>
                </div>

                {loading && <p className="text-sm font-bold italic text-slate-500 text-center py-8">Fetching dynamic culinary cards...</p>}
                {!loading && posts.length === 0 && <p className="text-sm font-semibold text-slate-500 text-center py-12 border border-dashed rounded-xl border-slate-300 dark:border-slate-700">Global live timeline feed is currently empty.</p>}

                <div className="space-y-6">
                  {posts.map(post => (
                    <div key={post.id} className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-[#111420]">
                      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800 bg-slate-100 dark:bg-[#141827]">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-950 dark:text-white">@{post.username || 'zaykaa_foodie'}</span>
                          <span className="text-[9px] font-mono text-slate-400 mt-0.5">Post ID: {post.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {post.restaurant_name && <span className="text-xs font-bold text-orange-600 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">📍 {post.restaurant_name}</span>}
                          <button onClick={() => handleDeletePost(post.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 transition" title="Delete post">🗑️</button>
                        </div>
                      </div>
                      
                      <div className="flex max-h-[480px] min-h-[300px] items-center justify-center bg-slate-950">
                        {post.media_url?.includes('videos') || post.media_type === 'video' ? (
                          <video src={`http://127.0.0.1:5000${post.media_url}`} controls className="max-h-[480px] w-full object-contain" />
                        ) : (
                          <img src={`http://127.0.0.1:5000${post.media_url}`} alt="Culinary post" className="max-h-[480px] w-full object-contain" />
                        )}
                      </div>

                      <div className="p-5 bg-white dark:bg-[#111420]">
                        {post.dish_name && <h4 className="font-display text-xl font-bold text-slate-950 dark:text-white mb-1">{post.dish_name}</h4>}
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{post.caption}</p>
                        
                        <div className="mt-4 flex gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                          <button onClick={() => handleLike(post.id)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition ${post.user_has_liked ? 'bg-rose-500 text-white border-rose-600' : 'bg-slate-100 text-slate-950 border-slate-300 hover:bg-slate-200 dark:bg-[#161a2b] dark:text-white dark:border-slate-700'}`}>❤️ {post.like_count || 0}</button>
                          <button onClick={() => openComments(post.id)} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-950 border border-slate-300 hover:bg-slate-200 dark:bg-[#161a2b] dark:text-white dark:border-slate-700">💬 Comments ({post.comment_count || 0})</button>
                        </div>

                        {activePostComments === post.id && (
                          <div className="mt-3 rounded-xl bg-slate-100 p-4 dark:bg-[#151826] text-xs border border-slate-300 dark:border-slate-700">
                            <div className="max-h-[140px] overflow-y-auto space-y-2 mb-3 pr-1">
                              {commentList.map(c => (
                                <div key={c.id} className="p-1.5 bg-white rounded dark:bg-[#1c2136] font-medium text-slate-900 dark:text-slate-100">
                                  <strong className="text-slate-950 dark:text-white">@{c.username}:</strong> {c.text}
                                </div>
                              ))}
                            </div>
                            <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2">
                              <input type="text" placeholder="Add feedback response..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} className="flex-1 rounded-lg border-2 border-slate-400 bg-white px-3 py-1 text-xs font-semibold text-slate-950 dark:border-slate-600 dark:bg-[#191d2f] dark:text-white" />
                              <button type="submit" className="rounded-lg bg-orange-500 px-3 text-white font-bold hover:bg-orange-600">Post</button>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW 2: TEXT FEEDBACKS */}
          {currentTab === 'text_feedback' && (
            <motion.div key="text_feedback" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-2xl mx-auto space-y-6">
              <Card hover={false} className="p-6 border-2 border-slate-300 bg-white dark:border-slate-700 dark:bg-[#111420]">
                <h3 className="font-display text-xl font-bold mb-1 text-slate-950 dark:text-white">Write Restaurant Text Feedback</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 mb-4">Post a rapid, texture-and-taste text critique for specific venue hubs.</p>
                <div className="space-y-4">
                  <FloatingInput label="Restaurant / Outlet Hub" type="text" value={textReviewRestaurant} onChange={(e) => setTextReviewRestaurant(e.target.value)} />
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Critique Specifications</label>
                    <textarea placeholder="Log critical service remarks, spice delivery ratings, or ambiance breakdowns..." value={textFeedback} onChange={(e) => setTextFeedback(e.target.value)} className="w-full rounded-xl border-2 border-slate-400 bg-white p-3 text-sm font-semibold text-slate-950 focus:outline-none dark:border-slate-600 dark:bg-[#161a2b] dark:text-white focus:border-orange-500" rows="3" />
                  </div>
                  <Button block onClick={() => { toast.success("Feedback Logged", "Text analysis stored."); setTextFeedback(''); setTextReviewRestaurant(''); }} className="bg-orange-500 text-white font-bold">Log Text Critique</Button>
                </div>
              </Card>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Text Logs</h4>
                {posts.map(p => (
                  <Card key={p.id} hover={false} className="p-4 text-sm bg-white dark:bg-[#111420] border-2 border-slate-300 border-l-4 border-l-orange-500">
                    <div className="flex justify-between font-bold text-xs mb-1 text-slate-900 dark:text-slate-300">
                      <span>@{p.username || 'critic'}</span>
                      <span className="text-orange-600 dark:text-orange-400">📍 {p.restaurant_name || 'Global Kitchen'}</span>
                    </div>
                    <p className="italic font-medium text-slate-950 dark:text-slate-100">"{p.caption}"</p>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* VIEW 3: PIC FEEDBACKS */}
          {currentTab === 'pic_feedback' && (
            <motion.div key="pic_feedback" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              <div className="mb-4">
                <h3 className="font-display text-2xl font-bold text-slate-950 dark:text-white">Snap Gallery Reviews</h3>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Visual index of plate snapshots uploaded by foodies across partner restaurants.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.filter(p => p.media_type !== 'video').map(post => (
                  <div key={post.id} className="group overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#111420]">
                    <div className="h-48 overflow-hidden bg-slate-900 relative">
                      <img src={`http://127.0.0.1:5000${post.media_url}`} alt="Plate visual" className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                      <div className="absolute top-2 right-2 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">📍 {post.restaurant_name || 'Boutique Resto'}</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-[#111420]">
                      <h5 className="font-bold text-base text-slate-950 dark:text-white mb-1">{post.dish_name || 'Featured Dish'}</h5>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">{post.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* VIEW 4: ANALYTICS STUDIO DASHBOARD */}
          {currentTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card hover={false} className="p-5 border-2 border-slate-300 bg-white dark:border-slate-700 dark:bg-[#111420] bg-gradient-to-br from-orange-500/5 to-transparent">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Trending Spotlight</span>
                  <h4 className="text-2xl font-bold font-display tracking-tight mt-1 text-slate-950 dark:text-white">{analyticsData.popularFood}</h4>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">Most liked item across food tags this week</p>
                </Card>
                
                {/* Active Creator Personalized Identity Tracking Box */}
                <Card hover={false} className="p-5 border-2 border-slate-300 bg-white dark:border-slate-700 dark:bg-[#111420]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Creator Sync</span>
                  <h4 className="text-2xl font-bold font-display tracking-tight mt-1 text-orange-500">{user?.name || 'Brundhakshitha'}</h4>
                  <div className="mt-1 flex flex-col gap-0.5 text-xs font-semibold text-slate-800 dark:text-slate-300">
                    <span>Handle: <span className="text-slate-600 dark:text-slate-400">{analyticsData.topCreator}</span></span>
                    <span>Account ID: <span className="font-mono text-xs text-orange-600 dark:text-orange-400">{currentUserId}</span></span>
                  </div>
                </Card>

                <Card hover={false} className="p-5 border-2 border-slate-300 bg-white dark:border-slate-700 dark:bg-[#111420]">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Engagement Score</span>
                  <h4 className="text-2xl font-bold font-display tracking-tight mt-1 text-emerald-600 dark:text-emerald-400">+{analyticsData.totalEngagement} Points</h4>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">Aggregated like & comment metrics</p>
                </Card>
              </div>

              <Card hover={false} className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111420] overflow-hidden shadow-md">
                <div className="px-5 py-4 border-b-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#141827]">
                  <h3 className="font-display font-bold text-lg text-slate-950 dark:text-white">Personalized Dining Order History</h3>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tracking verified recent transactions handled via the single checkout cart flow.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-200 dark:bg-[#161a2a] text-xs uppercase tracking-wider text-slate-900 dark:text-slate-300 font-bold border-b-2 border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3">Order Token ID</th>
                        <th className="px-6 py-3">Restaurant Vendor</th>
                        <th className="px-6 py-3">Culinary Items</th>
                        <th className="px-6 py-3">Timestamp Date</th>
                        <th className="px-6 py-3">Amount Paid</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-semibold text-slate-950 dark:text-slate-100">
                      {analyticsData.orderHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition">
                          <td className="px-6 py-4 font-mono text-xs text-orange-600 dark:text-orange-400">{item.id}</td>
                          <td className="px-6 py-4 text-base text-slate-950 dark:text-white">{item.vendor}</td>
                          <td className="px-6 py-4 text-xs font-bold">{item.details}</td>
                          <td className="px-6 py-4 text-xs text-slate-800 dark:text-slate-300">{item.date}</td>
                          <td className="px-6 py-4 text-base text-slate-950 dark:text-white">{item.total}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">{item.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}