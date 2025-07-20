"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import '../app/globals.css'
import { 
  BookOpen, 
  Trash2, 
  ArrowLeft, 
  Calendar,
  Search,
  Filter,
  Star,
  Clock,
  FileText,
  ExternalLink,
  CheckCircle
} from "lucide-react";

export default function SavedHistoryPage() {
  const [savedTopics, setSavedTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, recent, oldest
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadSavedTopics();
  }, []);

  const loadSavedTopics = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = JSON.parse(localStorage.getItem('savedTopics') || '[]');
        setSavedTopics(saved);
      }
    } catch (error) {
      console.error('Error loading saved topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromHistory = (topicToRemove) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = JSON.parse(localStorage.getItem('savedTopics') || '[]');
        const filtered = saved.filter(item => item.topic !== topicToRemove);
        localStorage.setItem('savedTopics', JSON.stringify(filtered));
        setSavedTopics(filtered);
      }
    } catch (error) {
      console.error('Error removing topic:', error);
    }
  };

  const clearAllHistory = () => {
    if (confirm('Are you sure you want to clear all saved topics? This action cannot be undone.')) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('savedTopics');
          setSavedTopics([]);
        }
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  };

  // Show notification
  const showNotificationMessage = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  const openTopic = (topic) => {
    // Find the saved topic data
    const savedTopic = savedTopics.find(item => item.topic === topic);
    
    if (savedTopic && savedTopic.content) {
      // Restore the saved content to the cache before navigating
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          // Get existing cache
          const existingCache = JSON.parse(localStorage.getItem('learnPlanContentCache') || '{}');
          
          // Add the saved content to cache with normalized key
          const normalizedTopic = topic.trim().toLowerCase();
          existingCache[normalizedTopic] = savedTopic.content;
          
          // Save back to localStorage
          localStorage.setItem('learnPlanContentCache', JSON.stringify(existingCache));
          showNotificationMessage('Content restored to cache!');
        }
      } catch (error) {
        console.error('Error restoring content to cache:', error);
        showNotificationMessage('Error restoring content');
      }
    }
    
    const queryString = new URLSearchParams({ find: topic }).toString();
    router.push(`/resources?${queryString}`);
  };

  // Filter and search topics
  const filteredTopics = savedTopics
    .filter(topic => 
      topic.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (topic.description && topic.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (filterType) {
        case 'recent':
          return new Date(b.savedAt) - new Date(a.savedAt);
        case 'oldest':
          return new Date(a.savedAt) - new Date(b.savedAt);
        case 'alphabetical':
          return a.topic.localeCompare(b.topic);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Head>
          <title>Loading Saved History - Ai-Learn</title>
        </Head>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-300">Loading saved topics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <Head>
        <title>Saved History - Ai-Learn</title>
      </Head>
      
      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg border bg-green-600 text-white border-green-500"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{notificationMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-indigo-400" />
                Saved History
              </h1>
            </div>
            
            {savedTopics.length > 0 && (
              <button
                onClick={clearAllHistory}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{savedTopics.length}</div>
              <div className="text-gray-400 text-sm">Total Saved</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {savedTopics.length > 0 ? new Date(savedTopics[0].savedAt).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-gray-400 text-sm">Last Saved</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {savedTopics.length > 0 ? Math.ceil(savedTopics.length / 10) : 0}
              </div>
              <div className="text-gray-400 text-sm">Pages (10 per page)</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search saved topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Topics</option>
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </motion.div>

        {/* Topics List */}
        {savedTopics.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-700 text-center"
          >
            <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-300 mb-2">No Saved Topics</h2>
            <p className="text-gray-400 mb-6">
              You haven't saved any topics yet. Start exploring and save interesting topics to see them here!
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Start Exploring
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic, index) => (
              <motion.div
                key={`${topic.topic}-${topic.savedAt}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                      {topic.topic}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-3">
                      {topic.description}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromHistory(topic.topic)}
                    className="ml-2 p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Remove from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(topic.savedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(topic.savedAt).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openTopic(topic.topic)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Open
                  </button>
                  <button
                    onClick={() => {
                      // Find the saved topic data
                      const savedTopic = savedTopics.find(item => item.topic === topic.topic);
                      
                      if (savedTopic && savedTopic.content) {
                        // Restore the saved content to the cache before opening
                        try {
                          if (typeof window !== 'undefined' && window.localStorage) {
                            // Get existing cache
                            const existingCache = JSON.parse(localStorage.getItem('learnPlanContentCache') || '{}');
                            
                            // Add the saved content to cache with normalized key
                            const normalizedTopic = topic.topic.trim().toLowerCase();
                            existingCache[normalizedTopic] = savedTopic.content;
                            
                            // Save back to localStorage
                            localStorage.setItem('learnPlanContentCache', JSON.stringify(existingCache));
                            showNotificationMessage('Content restored to cache!');
                          }
                        } catch (error) {
                          console.error('Error restoring content to cache:', error);
                          showNotificationMessage('Error restoring content');
                        }
                      }
                      
                      const queryString = new URLSearchParams({ find: topic.topic }).toString();
                      window.open(`/resources?${queryString}`, '_blank');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Results */}
        {savedTopics.length > 0 && filteredTopics.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-700 text-center"
          >
            <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-300 mb-2">No Results Found</h2>
            <p className="text-gray-400">
              No saved topics match your search criteria. Try adjusting your search terms.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
} 