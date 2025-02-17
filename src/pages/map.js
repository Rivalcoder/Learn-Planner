"use client";
import "../app/globals.css";
import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";

import { Button } from "../components/button";
import { Checkbox } from "../components/checkbox";
import { Input } from "../components/input";

export default function LearningPage() {
  const [title, setTitle] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("generatedTopics"); 
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      viewdata1(); 
    },500); 

    return () => clearTimeout(timer);
  }, []);


  const storeTopicsInLocalStorage = (topics) => {
    localStorage.removeItem("generatedTopics");
    if (typeof window !== "undefined") {
      localStorage.setItem("generatedTopics", JSON.stringify({ topic: title, body: topics })); 
    }
  };

  const storedata = (topics) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mytaskdata", JSON.stringify({ topic: title, body: topics }));
    }
  }

  const viewdata = () => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("mytaskdata");
      const Data = JSON.parse(storedData);
      setTopics(Data.body);
    }
  }
  const viewdata1 = () => {
    const storedData = localStorage.getItem("generatedTopics");
    if (typeof window !== "undefined" && storedData) {
      const Data = JSON.parse(storedData);
      setTopics(Data.body);
    }
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
    if(!title){
      alert("Enter Any Title To Search..")
      return 
    }
    setLoading(true);
    setError(null);
    setTopics([]);
    const selectedDifficulties = selectedDifficulty ? [selectedDifficulty] : ["medium"];
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

      const initialTopics = data.topics.map(topic => ({
        ...topic,
        editable: false,
        subtopics: topic.subtopics.map(subtopic => ({ name: subtopic, completed: false }))
      }));
      setTopics(initialTopics);
      storeTopicsInLocalStorage(initialTopics);  // Save the topics to localStorage


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

  const toggleSubtopicCompletion = (topicIndex, subtopicIndex) => {
    setTopics(prevTopics => {
      const newTopics = [...prevTopics];
      newTopics[topicIndex] = {
        ...newTopics[topicIndex],
        subtopics: newTopics[topicIndex].subtopics.map((subtopic, index) =>
          index === subtopicIndex ? { ...subtopic, completed: !subtopic.completed } : subtopic
        )
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem("mytaskdata", JSON.stringify({ topic: title, body: newTopics }));
      }
      return newTopics;
    });
  };

  const handleTopicNameChange = (topicIndex, newName) => {
    setTopics(prevTopics => {
      const newTopics = [...prevTopics];
      newTopics[topicIndex] = { ...newTopics[topicIndex], name: newName };
      return newTopics;
    });
  };

  const handleedit = (topicIndex) => {
    setTopics(prevTopics => {
      const newTopics = [...prevTopics];
      newTopics[topicIndex] = { ...newTopics[topicIndex], editable: !newTopics[topicIndex].editable }
      return newTopics;
    });
  }

  return (
      
      <div className="bg-gray-900 text-white font-sans min-h-screen py-6 px-4 sm:px-0 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto p-8 flex flex-col gap-8 items-center rounded-2xl shadow-lg bg-gray-800 border border-gray-700"
      >
        <h1 className="text-3xl font-extrabold text-center text-white mb-6 tracking-tight">
          Learning Path Generator
        </h1>
        
        {/* Centered Input Section */}
        <div ref={dropdownRef} className="relative w-full max-w-lg">
          <Input
            placeholder="Enter what you want to learn"
            value={title}
            onChange={handleInputChange}
            className="p-4 border border-gray-700 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-700 text-white placeholder-gray-400 shadow-inner"
          />
          {suggestions.length > 0 && (
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute z-10 mt-2 w-full bg-gray-700 border border-gray-600 rounded-xl shadow-md overflow-auto max-h-52"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="p-3 cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </motion.ul>
          )}
        </div>

        {/* Difficulty Selection */}
        <div className="flex gap-6 justify-center">
          {["easy", "medium", "hard"].map((level) => (
            <label key={level} className="flex items-center gap-2 text-lg">
              <input
                type="checkbox"
                checked={selectedDifficulty === level}
                onChange={() => {
                  if (level === selectedDifficulty) { setSelectedDifficulty('') }
                  else {
                    setSelectedDifficulty(level)
                  }
                }}
                className="w-6 h-6 accent-indigo-500 cursor-pointer"
              />
              <span className="capitalize">{level}</span>
            </label>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col  gap-4 w-full max-w-md">
          <div className="">
          <Button
            onClick={handleSubmit}
            className="w-full flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Generating Path..." : "Generate Learning Path"}
          </Button>
          
          </div>
          <div >

          <div className="flex gap-2">
            <Button
              className="flex-1 py-3 px-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition-colors duration-200 disabled:opacity-50"
              disabled={loading}
              onClick={() => storedata(topics)}
            >
              Save Tasks
            </Button>
            <Button
              className="flex-1 py-3 px-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition-colors duration-200 disabled:opacity-50"
              disabled={loading}
              onClick={() => viewdata()}
            >
              View Saved Tasks
            </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 mt-2">{error}</motion.p>}

        {/* Topics List or Placeholder */}
        {topics.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 space-y-6 w-full max-w-3xl"
          >
            {topics.map((topic, topicIndex) => (
              <motion.div
                key={topicIndex}
                className="p-5 border rounded-2xl shadow-md bg-gray-700 border-gray-600 hover:shadow-lg transition-shadow duration-300"
                whileHover={{ scale: 1.03 }}
              >
                {topic.editable ? (
                  <Input
                    type="text"
                    value={topic.name}
                    onChange={(e) => handleTopicNameChange(topicIndex, e.target.value)}
                    onBlur={() => handleedit(topicIndex)}
                    className="w-full p-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-600 text-white placeholder-gray-400 shadow-inner"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <h2 className="ml-7 text-xl font-semibold text-orange-500">{topic.name}</h2>
                    <Button onClick={() => handleedit(topicIndex)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl transition-colors duration-200">Edit</Button>
                  </div>
                )}
                <div className="mt-4 space-y-3">
                  {topic.subtopics.map((subtopic, subtopicIndex) => (
                    <motion.div
                      key={subtopicIndex}
                      className="p-3 flex items-center gap-3 rounded-xl hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                      <Checkbox
                        checked={subtopic.completed}
                        onChange={() => toggleSubtopicCompletion(topicIndex, subtopicIndex)}
                      />
                      <div onClick={() => handleTopicClick(subtopic.name + " in " + topic.name + " ref of header:" + title)} className="text-lg">
                        {subtopic.name}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-8 p-8 border rounded-2xl shadow-md bg-gray-700 border-gray-600 text-center"
          >
            <p className="text-lg italic text-gray-400">No topics generated yet. Enter a subject and click "Generate Learning Path" to get started!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
