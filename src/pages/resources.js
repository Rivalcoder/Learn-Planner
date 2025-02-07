"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import "../app/globals.css";

export default function TopicDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(null);
  const searchParams = useSearchParams();
  const topic = searchParams.get("find");

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
        throw new Error("Failed to fetch topic details");
      }

      const data = await response.json();
      setContent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-xl">Generating detailed content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <XCircle className="w-12 h-12 mx-auto text-red-600" />
          <p className="text-xl text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      {content && (
        <div className="space-y-10">
          {/* Topic Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">
              {content.topic}
            </h1>
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-6 h-6 mr-2" />
              <span className="font-medium">Generated Content Ready</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Description
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {content.describe}
            </p>
          </div>

          {/* Examples */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Examples
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {content.examples.map((example, index) => (
                <li key={index} className="leading-relaxed">
                  {example}
                </li>
              ))}
            </ul>
          </div>

          {/* Code Section (if applicable) */}
          {content.code && content.code.topicofcode && content.code.tcode && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                Implementation
              </h2>
              <h3 className="text-lg font-semibold text-gray-800">
                {content.code.topicofcode}
              </h3>
              <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto text-sm mt-4">
                <code>{content.code.tcode}</code>
              </pre>
              {content.define && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    Code Explanation
                  </h3>
                  <ul className="list-disc pl-6 space-y-3 text-gray-700">
                    {content.define.map((def, index) => (
                      <li key={index} className="leading-relaxed">
                        <code className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {def.code}
                        </code>
                        <p className="mt-1">{def.explain}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Importance */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Key Points & Importance
            </h2>
            <ul className="space-y-3">
              {content.importance.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-lg font-semibold mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Reference Articles */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Reference Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {content.article.map((article, index) => (
                <div
                  key={index}
                  className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    {article.urltopic}
                  </h3>
                  <a
                    href={article.Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Read More
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
