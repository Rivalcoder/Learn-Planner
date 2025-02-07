"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "../components/button";
import { Checkbox } from "../components/checkbox";
import { Input } from "../components/input";

export default function LearningPage() {
  const [title, setTitle] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSuggestions([]); // Close suggestions when clicking outside
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDifficultyChange = (level) => {
    setSelectedDifficulty(level === selectedDifficulty ? null : level);
  };

  const storedata =(topics)=>{
    console.log(topics);
    if (typeof window !== "undefined") {
      localStorage.setItem("mytaskdata", JSON.stringify(topics));
    }

  }

  const viewdata =()=>{

  }

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
    setTitle(value);
    debounceFetchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setTitle(suggestion);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setTopics([])
    const selectedDifficulties = selectedDifficulty ? [selectedDifficulty] : [];
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, difficulty: selectedDifficulties }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate topics");
      }
      
      const data = await response.json();
      setTopics(data.topics);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topicName) => {
    const queryString = new URLSearchParams({ find: topicName }).toString();
    router.push(`/resources?${queryString}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="p-6 space-y-4 border rounded-lg shadow-md relative bg-white"
      >
        <div ref={dropdownRef} className="relative">
          <Input
            placeholder="Enter what you want to learn"
            value={title}
            onChange={handleInputChange}
            className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {suggestions.length > 0 && (
            <motion.ul 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute bg-white border rounded-lg shadow-md mt-1 w-full max-h-40 overflow-auto z-10"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </motion.ul>
          )}
        </div>
        <div className="flex gap-4">
          {["easy", "medium", "hard"].map((level) => (
            <label key={level} className="flex items-center gap-2">
              <Checkbox
                checked={selectedDifficulty === level}
                onCheckedChange={() => handleDifficultyChange(level)}
              />
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </label>
          ))}
        </div>
        <Button onClick={handleSubmit} className="w-full transition-all transform hover:scale-105 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button >
        <div className="flex gap-2">
        <Button 
          className="flex-1 transition-all transform hover:scale-105 bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-lg" disabled={loading}
          onClick={storedata()}
        >
            Save Tasks
        </Button>
        <Button 
          className="flex-1 transition-all transform hover:scale-105 bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-lg" disabled={loading}
          onClick={viewdata()}
        >
             View Saved Tasks
        </Button>
        </div>
        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 mt-2">{error}</motion.p>}
      </motion.div>
      {topics.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="mt-6 space-y-4"
        >
          {topics.map((topic, index) => (
            <motion.div 
              key={index} 
              whileHover={{ scale: 1.02 }} 
              className="p-4 border rounded-lg shadow-md"
            >
              <h2 className="text-lg font-semibold">{topic.name}</h2>
              <div className="space-y-2 mt-2">
                {topic.subtopics.map((sub, i) => (
                  <div
                    key={i}
                    className="p-2 cursor-pointer hover:bg-gray-100 rounded-lg flex items-center gap-2"
                    
                  >
                    <Checkbox />
                    <div onClick={() => handleTopicClick(topic.name)}>
                    {sub}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}