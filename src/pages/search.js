import { useState, useEffect, useRef } from 'react';
import '../app/globals.css';
import { VscSend } from "react-icons/vsc";
import { useRouter } from 'next/router';

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [Err, setErr] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSuggestions([]); // Close suggestions when clicking outside
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
    setErr(false); // Reset error state on input change
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setSuggestions([]); // Close suggestions after selecting one
  };

  const handleSearch = () => {
    if (query) {
      const queryString = new URLSearchParams({ find: query }).toString();
      router.push(`/resources?${queryString}`);
    } else {
      setErr(true);
    }
  };
  const fadeIn = isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5";

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className={`${fadeIn} flex flex-col items-center gap-8 p-12 bg-gray-800 rounded-3xl shadow-2xl w-[90%] max-w-[600px] transform transition-all hover:shadow-neon hover:scale-105`}>
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          AI Search
        </h1>
        <p className="text-gray-300 text-center text-lg">
          Unleash the power of AI to find answers in seconds.
        </p>
        <div className="flex flex-row gap-4 w-full">
          <div ref={dropdownRef} className="relative w-full">
            <input
              type="text"
              placeholder="Ask me anything..."
              className="flex-1 w-full outline-none rounded-xl focus:ring-4 focus:ring-blue-500 text-lg h-16 bg-gray-700 px-6 border border-gray-600 transition-all placeholder-gray-400 text-white"
              value={query}
              onChange={handleInputChange}
            />
            {suggestions.length > 0 && (
              <ul className="absolute bg-gray-700 text-white border rounded-lg shadow-md mt-1 w-full max-h-40 overflow-auto z-10">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="p-2 cursor-pointer hover:bg-gray-600"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-110 active:scale-95 shadow-lg"
          >
            <VscSend size={28} className="text-white" />
          </button>
        </div>
        {Err && <p className="font-medium text-xl text-red-600">Please! Enter input to search..</p>}
      </div>
    </div>
  );
}
