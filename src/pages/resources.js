"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import mermaid from 'mermaid';
import { Highlight, themes } from 'prism-react-renderer';
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
  ChevronRight,
  Youtube,
  Target,
  AlertTriangle,
  Terminal
} from "lucide-react";
import "../app/globals.css";

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    fontFamily: 'monospace',
    fontSize: '16px',
    primaryColor: '#6366f1',
    primaryTextColor: '#fff',
    primaryBorderColor: '#6366f1',
    lineColor: '#6366f1',
    secondaryColor: '#4f46e5',
    tertiaryColor: '#4338ca',
  }
});

const CodeBlock = ({ code, language = "javascript" }) => {
  return (
    <Highlight
      theme={themes.nightOwl}
      code={code}
      language={language}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={`${className} p-4 rounded-xl overflow-x-auto text-sm border border-gray-700`} style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};

const LanguageImplementation = ({ implementations, title }) => {
  const [activeTab, setActiveTab] = useState(0);
  const languages = ["Java", "Python", "C", "C++"];

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {languages.map((lang, index) => (
          <button
            key={lang}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === index
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
      
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h4 className="text-sm font-medium text-indigo-400">
            {languages[activeTab]} Implementation
          </h4>
        </div>
        <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm">
          <code className="whitespace-pre-wrap">{implementations[activeTab].code}</code>
        </pre>
        <div className="mt-4 space-y-2">
          <p className="text-gray-300 text-sm">
            <span className="font-medium text-indigo-400">Time Complexity:</span> {implementations[activeTab].timeComplexity}
          </p>
          <p className="text-gray-300 text-sm">
            <span className="font-medium text-indigo-400">Space Complexity:</span> {implementations[activeTab].spaceComplexity}
          </p>
          <p className="text-gray-300 text-sm">
            <span className="font-medium text-indigo-400">Explanation:</span> {implementations[activeTab].explanation}
          </p>
        </div>
      </div>
    </div>
  );
};

const MermaidDiagram = ({ diagram }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        // Add unique ID for each diagram to prevent conflicts
        const uniqueId = `mermaid-diagram-${Math.random().toString(36).substr(2, 9)}`;
        
        // Ensure the diagram has a type specification
        let diagramText = diagram;
        if (!diagramText.startsWith('graph') && !diagramText.startsWith('flowchart')) {
          diagramText = `flowchart TD\n${diagramText}`;
        }
        
        const { svg } = await mermaid.render(uniqueId, diagramText);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
      }
    };

    if (diagram) {
      renderDiagram();
    }
  }, [diagram]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
};

const StepByStepDiagram = ({ steps }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!steps || steps.length === 0) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Process each step to ensure it has the correct diagram type
  const processedSteps = steps.map(step => {
    if (!step.startsWith('graph') && !step.startsWith('flowchart')) {
      return `flowchart TD\n${step}`;
    }
    return step;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentStep === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-500 text-white hover:bg-indigo-600'
          }`}
        >
          Previous Step
        </button>
        <span className="text-gray-300">
          Step {currentStep + 1} of {steps.length}
        </span>
        <button
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentStep === steps.length - 1
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-500 text-white hover:bg-indigo-600'
          }`}
        >
          Next Step
        </button>
      </div>
      <MermaidDiagram diagram={processedSteps[currentStep]} />
    </div>
  );
};

const OperationSteps = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        Operation Steps
      </h3>
      {steps.map((step, index) => (
        <div key={index} className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h4 className="text-lg font-medium text-indigo-400 mb-4">
            {step.operation}
          </h4>
          <StepByStepDiagram steps={step.steps.map(s => s.diagram)} />
          <div className="mt-4 space-y-2">
            {step.steps.map((subStep, subIndex) => (
              <p key={subIndex} className="text-gray-300 text-sm">
                <span className="font-medium text-indigo-400">Step {subStep.stepNumber}:</span> {subStep.description}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const DataStructureVisualization = ({ visualization }) => {
  if (!visualization) return null;

  return (
    <div className="space-y-6">
      {/* Initial Structure Diagram */}
      {visualization.mermaidDiagram && (
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-indigo-400" />
            Data Structure Overview
          </h3>
          <MermaidDiagram diagram={visualization.mermaidDiagram} />
          {visualization.diagramExplanation && (
            <p className="mt-4 text-gray-300 text-sm">
              {visualization.diagramExplanation}
            </p>
          )}
        </div>
      )}

      {/* Operation Steps */}
      {visualization.operationSteps && visualization.operationSteps.length > 0 && (
        <OperationSteps steps={visualization.operationSteps} />
      )}
    </div>
  );
};

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
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {content.describe || content.description}
              </p>
            </motion.div>

            {/* Visualization Section */}
            {content.visualization && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <DataStructureVisualization visualization={content.visualization} />
              </motion.div>
            )}

            {/* Sub Topics - Only show if available */}
            {content.subtopics && content.subtopics.length > 0 && (
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
                          {example.subexample && (
                            <pre className="bg-gray-900/50 text-white p-4 rounded-xl overflow-x-auto text-sm mb-4 border border-gray-700">
                              <code>{example.subexample}</code>
                            </pre>
                          )}
                          {example.exmexplain && example.exmexplain.length > 0 && (
                            <ul className="mt-4 space-y-2">
                              {example.exmexplain.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-gray-300">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Implementation - Only show if available */}
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
                <CodeBlock code={content.code.tcode} language="javascript" />
                {content.define && content.define.length > 0 && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setClick(click === 'code-explanation' ? null : 'code-explanation')}
                      className="w-full text-left flex items-center justify-between group"
                    >
                      <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                        <Code className="w-5 h-5 text-indigo-400" />
                        Code Explanation
                      </h3>
                      <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                        {click === 'code-explanation' ? "Hide Explanation" : "Show Explanation"}
                      </span>
                    </button>
                    <AnimatePresence>
                      {click === 'code-explanation' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <ul className="space-y-4">
                            {content.define.map((def, index) => (
                              <li key={index} className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
                                <CodeBlock code={def.code} language="javascript" />
                                <p className="mt-2 text-gray-300">{def.explain}</p>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* Key Points & Importance - Only show if available */}
            {content.importance && content.importance.length > 0 && (
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
            )}

            {/* Prerequisites - Only show if available */}
            {content.prerequisites && content.prerequisites.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
              >
                <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  Prerequisites
                </h2>
                <ul className="space-y-3">
                  {content.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-300">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-semibold">
                        {index + 1}
                      </div>
                      {prereq}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Learning Objectives - Only show if available */}
            {content.learningObjectives && content.learningObjectives.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
              >
                <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                  <Target className="w-6 h-6 text-green-400" />
                  Learning Objectives
                </h2>
                <ul className="space-y-3">
                  {content.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-300">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-semibold">
                        {index + 1}
                      </div>
                      {objective}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Common Misconceptions - Only show if available */}
            {content.commonMisconceptions && content.commonMisconceptions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
              >
                <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  Common Misconceptions
                </h2>
                <div className="space-y-6">
                  {content.commonMisconceptions.map((misconception, index) => (
                    <div key={index} className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-semibold">
                          {index + 1}
                        </div>
                        <h3 className="text-lg font-semibold text-white">{misconception.misconception}</h3>
                      </div>
                      <div className="ml-9 space-y-3">
                        <p className="text-gray-300">
                          <span className="font-medium text-red-400">Why it's wrong:</span> {misconception.explanation}
                        </p>
                        <p className="text-gray-300">
                          <span className="font-medium text-green-400">Correct understanding:</span> {misconception.correction}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Practice Exercises - Only show if available */}
            {content.practiceExercises && content.practiceExercises.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
              >
                <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                  <Code className="w-6 h-6 text-blue-400" />
                  Practice Exercises
                </h2>
                <div className="space-y-6">
                  {content.practiceExercises.map((exercise, index) => (
                    <div key={index} className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold">
                            {index + 1}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            exercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                            exercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                          </span>
                        </div>
                        <button
                          onClick={() => setClick(click === `exercise-${index}` ? null : `exercise-${index}`)}
                          className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          {click === `exercise-${index}` ? "Hide Solution" : "Show Solution"}
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-400 mb-2">Question:</h4>
                          <p className="text-gray-300 whitespace-pre-wrap">{exercise.question}</p>
                        </div>
                        <AnimatePresence>
                          {click === `exercise-${index}` && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-3"
                            >
                              <div className="bg-gray-800/50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-400 mb-2">Solution:</h4>
                                <CodeBlock code={exercise.solution} language="javascript" />
                              </div>
                              <div className="bg-gray-800/50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-400 mb-2">Explanation:</h4>
                                <p className="text-gray-300 whitespace-pre-wrap">{exercise.explanation}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Reference Articles and Videos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-8"
            >
              {/* Web Resources - Only show if available */}
              {content.webResults && content.webResults.length > 0 && (
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                    <Link className="w-6 h-6 text-indigo-400" />
                    Web Resources
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {content.webResults.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ y: -5 }}
                        className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{result.title}</h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{result.snippet}</p>
                        <a 
                          href={result.url} 
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
                </div>
              )}

              {/* YouTube Videos - Only show if available */}
              {content.youtubeResults && content.youtubeResults.length > 0 && (
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                    <Youtube className="w-6 h-6 text-red-500" />
                    Video Tutorials
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {content.youtubeResults.map((video, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ y: -5 }}
                        className="bg-gray-900/50 rounded-xl border border-gray-700 hover:border-red-500/50 transition-colors overflow-hidden"
                      >
                        <div className="aspect-video relative">
                          <iframe
                            src={`https://www.youtube.com/embed/${video.url.split('v=')[1]}`}
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          ></iframe>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">{video.title}</h3>
                          <p className="text-gray-400 text-sm">{video.channelTitle}</p>
                          <a 
                            href={video.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-red-400 hover:text-red-300 flex items-center gap-1 mt-2"
                          >
                            Watch on YouTube
                            <ChevronRight className="w-4 h-4" />
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
