"use client";
import "../app/globals.css";
import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  ChevronRight, 
  Search, 
  Check, 
  Award, 
  Layers,
  RotateCcw,
  Sparkles,
  Brain,
  Zap,
  Rocket,
  Loader2
} from "lucide-react";

// Loading Animation Component
const LoadingAnimation = ({ title, isGenerating = false }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <Head>
        <title>{title ? `Generating ${title}...` : 'Generating Learning Path...'} - Ai-Learn</title>
      </Head>
      <div className="text-center space-y-8">
        <div className="relative">
          {/* Outer Ring */}
          <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-500/20 rounded-full animate-pulse" />
          {/* Middle Ring */}
          <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-500/40 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
          {/* Inner Ring */}
          <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-500/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          {/* Center Icon */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-indigo-500 animate-bounce" style={{ animationDelay: '0.6s' }} />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xl text-gray-300 font-medium">
            {isGenerating ? "Generating learning path..." : "Creating your personalized learning journey..."}
          </p>
          <p className="text-sm text-gray-400">
            {isGenerating ? "Building comprehensive learning modules" : "This may take a few moments"}
          </p>
        </div>
        {/* Loading Dots */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
};

export default function LearningPathGenerator() {
  const [title, setTitle] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('learningPathData');
    if (savedData) {
      const { title: savedTitle, topics: savedTopics, difficulty } = JSON.parse(savedData);
      setTitle(savedTitle);
      setTopics(savedTopics);
      setSelectedDifficulty(difficulty);
    }
  }, []);

  // Save data whenever topics change
  useEffect(() => {
    if (topics.length > 0) {
      localStorage.setItem('learningPathData', JSON.stringify({
        title,
        topics,
        difficulty: selectedDifficulty
      }));
    }
  }, [topics, title, selectedDifficulty]);

  // Add click outside handler for suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add suggestion fetching function
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

  // Add debounced suggestion fetching
  const debounceFetchSuggestions = (query) => {
    clearTimeout(window.suggestionTimeout);
    window.suggestionTimeout = setTimeout(() => fetchSuggestions(query), 300);
  };

  // Update title change handler
  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    debounceFetchSuggestions(value);
  };

  // Add suggestion click handler
  const handleSuggestionClick = (suggestion) => {
    setTitle(suggestion);
    setSuggestions([]);
  };

  const handleSubmit = async (fromCard = false) => {
    if (!fromCard && !title) {
      alert("Enter a topic to generate a learning path");
      return;
    }
    
    setLoading(true);
    try {
      console.log('Submitting with title:', title); // Debug log
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: title.trim(),
          difficulty: [selectedDifficulty] 
        }),
      });

      const data = await response.json();
      const processedTopics = data.topics.map(topic => ({
        ...topic,
        progress: calculateTopicProgress(topic.subtopics),
        subtopics: topic.subtopics.map(subtopic => ({
          name: subtopic,
          completed: false
        }))
      }));

      console.log('Processed Topics:', processedTopics);
      setTopics(processedTopics);
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTopicProgress = (subtopics) => {
    if (!subtopics || subtopics.length === 0) return 0;
    const completedCount = subtopics.filter(s => s.completed).length;
    return Math.round((completedCount / subtopics.length) * 100);
  };

  const toggleSubtopicCompletion = (topicIndex, subtopic) => {
    setTopics(prevTopics => {
      const newTopics = [...prevTopics];
      const topicToUpdate = newTopics[topicIndex];
      
      const updatedSubtopics = topicToUpdate.subtopics.map(sub => 
        sub.name === subtopic.name 
          ? { ...sub, completed: !sub.completed } 
          : sub
      );

      topicToUpdate.subtopics = updatedSubtopics;
      topicToUpdate.progress = calculateTopicProgress(updatedSubtopics);

      return newTopics;
    });
  };

  const handleReset = () => {
    setTitle("");
    setTopics([]);
    setSelectedDifficulty('medium');
    localStorage.removeItem('learningPathData');
  };

  // Show loading animation when generating
  if (loading) {
    return <LoadingAnimation title={title} isGenerating={true} />;
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen p-6 text-white">
      <Head>
        <title>Learning Path Generator</title>
      </Head>
      <div className="max-w-5xl mx-auto">
        {/* Reset Button - Only shown when topics exist */}
        {topics.length > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleReset}
            className="
              fixed top-4 right-4 p-2 rounded-full bg-gray-800/60 
              hover:bg-gray-700/60 text-white transition-all duration-300
              border border-gray-700
            "
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>
        )}

        {/* Search & Controls - Only shown when no topics exist */}
        {topics.length === 0 && (
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
                  Learning Path Generator
                </h1>
                <p className="text-xl text-gray-400">
                  Create your personalized learning journey with AI-powered guidance
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative w-full mb-8"
              >
                <div ref={dropdownRef} className="relative">
                  <input 
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="What do you want to learn?"
                    className="w-full p-4 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all text-lg"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
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

              

              {/* Difficulty Selector */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center space-x-4 mb-12"
              >
                {["easy", "medium", "hard"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedDifficulty(level)}
                    className={`
                      px-8 py-3 rounded-xl capitalize transition-all duration-300
                      ${selectedDifficulty === level 
                        ? 'bg-indigo-600 text-white scale-105 shadow-lg shadow-indigo-500/50' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}
                    `}
                  >
                    {level} Level
                  </button>
                ))}
              </motion.div>

              {/* Generate Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={loading}
                className="
                  w-full px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 
                  text-white font-bold tracking-wide text-lg
                  hover:from-indigo-700 hover:to-purple-700
                  transition-all duration-300
                  flex items-center justify-center gap-3
                  disabled:opacity-50
                "
              >
                {loading ? "Generating..." : "Generate Learning Path"}
                <BookOpen className="w-6 h-6" />
              </motion.button>
            </div>
            {/* Popular Topics Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-12"
              >
                <div className="text-center mb-6  mt-10">
                  <h3 className="text-xl font-semibold text-gray-300">Popular Learning Paths</h3>
                  <p className="text-sm text-gray-400 mt-2">Click on any topic to start learning</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { title: "Data Structures & Algorithms", icon: "⚡", color: "from-blue-500 to-indigo-500" },
                    { title: "Machine Learning", icon: "🤖", color: "from-purple-500 to-pink-500" },
                    { title: "Web Development", icon: "🌐", color: "from-green-500 to-emerald-500" },
                    { title: "Mobile Development", icon: "📱", color: "from-orange-500 to-red-500" },
                    { title: "Cloud Computing", icon: "☁️", color: "from-cyan-500 to-blue-500" },
                    { title: "Cybersecurity", icon: "🔒", color: "from-yellow-500 to-amber-500" }
                  ].map((topic, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        const selectedTitle = topic.title;
                        setTitle(selectedTitle);
                        setLoading(true);
                        // Wait for state update to be visible and processed
                        await new Promise(resolve => setTimeout(resolve, 100));
                        // Call handleSubmit with the selected title directly
                        try {
                          const response = await fetch("/api/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ 
                              title: selectedTitle,
                              difficulty: [selectedDifficulty] 
                            }),
                          });

                          const data = await response.json();
                          const processedTopics = data.topics.map(topic => ({
                            ...topic,
                            progress: calculateTopicProgress(topic.subtopics),
                            subtopics: topic.subtopics.map(subtopic => ({
                              name: subtopic,
                              completed: false
                            }))
                          }));

                          setTopics(processedTopics);
                        } catch (error) {
                          console.error("Generation error:", error);
                        } finally {
                          setLoading(false);
                        }
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
                        Generate Learning Path
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>

            {/* Example Feature Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="w-full max-w-5xl mx-auto mt-16 px-6"
            >
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-300">
                How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Example Topic Card */}
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-gray-300">Learning Path</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>Introduction to Basics</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>Core Concepts</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>Advanced Applications</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>Final Project</span>
                    </div>
                  </div>
                </motion.div>

                {/* Example Progress Card */}
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-gray-300">Progress</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Theory</span>
                      <span className="text-sm text-indigo-400">60%</span>
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-3/5 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Practice</span>
                      <span className="text-sm text-indigo-400">40%</span>
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-2/5 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Projects</span>
                      <span className="text-sm text-indigo-400">25%</span>
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-1/4 rounded-full" />
                    </div>
                  </div>
                </motion.div>

                {/* Example Resources Card */}
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-gray-300">Resources</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Documentation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Video Tutorials</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>Practice Exercises</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span>Code Examples</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Feature Highlights */}
              <div className="grid md:grid-cols-2 gap-6 mt-12">
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-xl font-semibold text-gray-300">AI-Powered Learning</h3>
                  </div>
                  <p className="text-gray-400">
                    Get personalized learning paths tailored to your goals and skill level
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-xl font-semibold text-gray-300">Smart Progress Tracking</h3>
                  </div>
                  <p className="text-gray-400">
                    Track your progress and get insights into your learning journey
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Learning Modules */}
        <AnimatePresence>
          {topics.map((topic, topicIndex) => (
            <motion.div
              key={topicIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700 relative overflow-hidden"
            >
              {/* Topic Progress */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Award className="text-indigo-500" />
                <span className="text-lg font-bold text-indigo-400">
                  {topic.progress}%
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                <Layers className="mr-3 text-indigo-500" />
                {topic.name}
              </h2>

              {/* Subtopics List */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <h3 className="text-lg font-semibold mb-3 text-gray-300">
                  Learning Modules ({topic.subtopics.length})
                </h3>
                {topic.subtopics.length > 0 ? (
                  <div className="space-y-2">
                    {topic.subtopics.map((subtopic, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ x: 10 }}
                        className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg transition-all"
                      >
                        <span 
                          className={`
                            text-base 
                            ${subtopic.completed 
                              ? 'line-through text-gray-500' 
                              : 'text-white'}
                          `}
                        >
                          {subtopic.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleSubtopicCompletion(topicIndex, subtopic)}
                            className={`
                              p-2 rounded-full transition-all
                              ${subtopic.completed 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-700 text-gray-400'}
                            `}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              const queryString = new URLSearchParams({ 
                                find: `${subtopic.name} in ${topic.name} ref of header:${title}` 
                              }).toString();
                              router.push(`/resources?${queryString}`);
                            }}
                            className="
                              px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 
                              text-white text-sm font-medium transition-all duration-300
                              flex items-center gap-1
                            "
                          >
                            Read More
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No modules available</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}