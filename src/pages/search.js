"use client";
import { useState, useEffect, useRef } from 'react';
import '../app/globals.css';
import Head from "next/head";
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { 
  Search as SearchIcon, 
  Send, 
  Sparkles, 
  Brain, 
  Zap, 
  BookOpen,
  Lightbulb,
  Target,
  Clock,
  ChevronRight
} from "lucide-react";

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [Err, setErr] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`/api/suggest?q=${query}`);
      const data = await response.json();
      setSuggestions(data[1] || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const debounceFetchSuggestions = (query) => {
    clearTimeout(window.suggestionTimeout);
    window.suggestionTimeout = setTimeout(() => fetchSuggestions(query), 300);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debounceFetchSuggestions(value);
    setErr(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setSuggestions([]);
  };

  const handleSearch = (fromTopic = false) => {
    if (query || fromTopic) {
      const queryString = new URLSearchParams({ find: query }).toString();
      router.push(`/resources?${queryString}`);
    } else {
      setErr(true);
    }
  };

  return (
    <div className="bg-gradient-to-br py-10 from-gray-900 via-gray-800 to-black text-white page-scroll">
      <Head>
        <title>AI Search</title>
      </Head>
      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-[90dvh] flex flex-col items-center justify-center relative"
        >
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Animated Lines */}
            <div className="absolute top-0 left-0 w-full h-full">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  transition={{ delay: i * 0.2 }}
                  className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                  style={{
                    top: `${(i + 1) * 20}%`,
                    transform: `rotate(${i * 15}deg)`
                  }}
                />
              ))}
            </div>
            
            {/* Decorative Icons */}
            <div className="absolute top-10 left-10 opacity-10">
              <Sparkles className="w-20 h-20 text-indigo-500" />
            </div>
            <div className="absolute bottom-10 right-10 opacity-10">
              <Brain className="w-20 h-20 text-purple-500" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
              <Zap className="w-32 h-32 text-indigo-500" />
            </div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12"
            >
              <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 mb-4">
                AI Search
              </h1>
              <p className="text-xl text-gray-400">
                Unleash the power of AI to find answers in seconds
              </p>
            </motion.div>

            {/* Search Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative w-full mb-8"
            >
              <div ref={dropdownRef} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Ask me anything..."
                  className="w-full p-4 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all text-lg"
                  value={query}
                  onChange={handleInputChange}
                />
                <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                {suggestions.length > 0 && (
                  <ul className="absolute bg-gray-800/90 backdrop-blur-sm text-white border border-gray-700 rounded-lg shadow-lg mt-1 w-full max-h-40 overflow-auto z-10">
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="p-3 cursor-pointer hover:bg-gray-700/50 transition-colors"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>

            {/* Search Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              className="
                w-full px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 
                text-white font-bold tracking-wide text-lg
                hover:from-indigo-700 hover:to-purple-700
                transition-all duration-300
                flex items-center justify-center gap-3
              "
            >
              Search
              <Send className="w-6 h-6" />
            </motion.button>

            {Err && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-center mt-4"
              >
                Please enter a search query
              </motion.p>
            )}
          </div>

          {/* Popular Topics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-12"
          >
            <div className="text-center mb-6 mt-10">
              <h3 className="text-xl font-semibold text-gray-300">Popular Topics</h3>
              <p className="text-sm text-gray-400 mt-2">Click on any topic to search</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { title: "JavaScript Basics", icon: "⚡", color: "from-blue-500 to-indigo-500" },
                { title: "Python Programming", icon: "🐍", color: "from-purple-500 to-pink-500" },
                { title: "React Development", icon: "⚛️", color: "from-green-500 to-emerald-500" },
                { title: "Node.js Backend", icon: "🟢", color: "from-orange-500 to-red-500" },
                { title: "SQL Database", icon: "🗄️", color: "from-cyan-500 to-blue-500" },
                { title: "Git Version Control", icon: "📚", color: "from-yellow-500 to-amber-500" }
              ].map((topic, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setQuery(topic.title);
                    searchInputRef.current?.focus();
                    const queryString = new URLSearchParams({ find: topic.title }).toString();
                    router.push(`/resources?${queryString}`);
                  }}
                  className="
                    bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700
                    hover:border-indigo-500/50 transition-all duration-300
                    text-left group relative overflow-hidden
                  "
                >
                  <div className="text-2xl mb-2">{topic.icon}</div>
                  <h3 className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    {topic.title}
                  </h3>
                  <div className="mt-2 flex items-center text-xs text-gray-400 group-hover:text-indigo-400 transition-colors">
                    Search Topic
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full max-w-5xl mx-auto mt-16 px-6"
          >
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-300">
              Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold text-gray-300">Smart Suggestions</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Get intelligent search suggestions as you type
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold text-gray-300">Precise Results</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Find exactly what you're looking for with AI-powered accuracy
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold text-gray-300">Instant Answers</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Get immediate responses to your questions
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold text-gray-300">Rich Content</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Access comprehensive learning resources and documentation
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
