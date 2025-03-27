"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  CheckCircle, 
  XCircle,
  BookOpen,
  Code,
  Lightbulb,
  Link,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Brain,
  Zap,
  ChevronRight
} from "lucide-react";
import "../app/globals.css";

export default function TopicDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(null);
  const searchParams = useSearchParams();
  const topic = searchParams.get("find");
  const [click, setClick] = useState(null);

  useEffect(() => {
    if (topic) {
      fetchTopicDetails(topic);
    }
  }, [topic]);

  const fetchTopicDetails = async (topicName) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/resourcelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: topicName }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch topic details. Please try again.");
      }

      const data = await response.json();
      setContent(data);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
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
            <p className="text-xl text-gray-300 font-medium">Generating detailed content...</p>
            <p className="text-sm text-gray-400">This may take a few moments</p>
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
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            {/* Error Icon with Animation */}
            <div className="w-24 h-24 mx-auto">
              <XCircle className="w-full h-full text-red-500 animate-pulse" />
            </div>
            {/* Error Ring */}
            <div className="absolute inset-0 w-24 h-24 border-4 border-red-500/20 rounded-full animate-ping" />
          </div>
          <div className="space-y-2">
            <p className="text-xl text-red-500 font-medium">{error}</p>
            <p className="text-sm text-gray-400">Please try again or contact support</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-5xl mx-auto">
        {content && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Topic Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">
                  {content.topic}
                </h1>
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  <span className="font-medium">Content Ready</span>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-400" />
                Description
              </h2>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{content.describe}</p>
            </motion.div>

            {/* Sub Topics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {content.subtopics.map((example, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
                >
                  <button
                    onClick={() => setClick(click === index ? null : index)}
                    className="w-full text-left flex items-center justify-between group"
                  >
                    <span className="text-xl font-semibold text-white flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-indigo-400" />
                      {example.subtop}
                    </span>
                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                      {click === index ? "Hide" : "Show"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {click === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4"
                      >
                        <p className="text-gray-300 mb-4">{example.subexplain}</p>
                        <pre className="bg-gray-900/50 text-white p-4 rounded-xl overflow-x-auto text-sm mb-4 border border-gray-700">
                          <code>{example.subexample}</code>
                        </pre>
                        <ul className="mt-4 space-y-2">
                          {example.exmexplain.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>

            {/* Points To Know */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-400" />
                Points To Know
              </h2>
              <ul className="space-y-3">
                {content.points.map((point, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold">
                      {index + 1}
                    </div>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Implementation */}
            {content.code && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
              >
                <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                  <Code className="w-6 h-6 text-indigo-400" />
                  Implementation
                </h2>
                <h3 className="text-lg font-semibold text-gray-300 mb-4">{content.code.topicofcode}</h3>
                <pre className="bg-gray-900/50 text-white p-4 rounded-xl overflow-x-auto text-sm mb-6 border border-gray-700">
                  <code>{content.code.tcode}</code>
                </pre>
                {content.define && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-300">Code Explanation</h3>
                    <ul className="space-y-4">
                      {content.define.map((def, index) => (
                        <li key={index} className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
                          <code className="font-mono bg-gray-800 px-3 py-1 rounded text-indigo-300">{def.code}</code>
                          <p className="mt-2 text-gray-300">{def.explain}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {/* Key Points & Importance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-400" />
                Key Points & Importance
              </h2>
              <ul className="space-y-4">
                {content.importance.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-gray-300">{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Reference Articles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                <Link className="w-6 h-6 text-indigo-400" />
                Reference Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {content.article.map((article, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ y: -5 }}
                    className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">{article.urltopic}</h3>
                    <a 
                      href={article.Url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      Read More
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
