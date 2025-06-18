"use client";
import "../app/globals.css";
import Head from "next/head";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Rocket, 
  Brain, 
  Zap, 
  ChevronRight 
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  // Handle window dimensions
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Initial dimensions
    updateDimensions();

    // Update on resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const currentContainer = containerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener('mousemove', handleMouseMove);
      return () => {
        currentContainer.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  const generateGlowEffect = () => ({
    backgroundImage: `radial-gradient(
      600px circle at ${mousePosition.x}px ${mousePosition.y}px, 
      rgba(29, 78, 216, 0.08), 
      transparent 80%
    )`
  });

  const FeatureCard = ({ icon: Icon, title, description }) => (
    <motion.div
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 0 15px rgba(99, 102, 241, 0.3)"
      }}
      className="
        bg-gray-800/60 backdrop-blur-sm border border-gray-700 
        rounded-2xl p-6 space-y-4 
        transition-all duration-300
        hover:bg-gray-800/80
      "
    >
      <div className="flex items-center gap-4">
        <Icon className="w-10 h-10 text-indigo-500" />
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );

  const AnimatedButton = ({ children, onClick, primary = false }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 
        px-6 py-3 rounded-xl 
        font-bold tracking-wide 
        transition-all duration-300
        group
        ${primary 
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700' 
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}
      `}
    >
      {children}
      <ChevronRight 
        className="
          w-5 h-5 
          transition-transform duration-300 
          group-hover:translate-x-1
        " 
      />
    </motion.button>
  );

  return (
    <div 
      ref={containerRef}
      style={generateGlowEffect()}
      className="
        min-h-screen bg-black
        text-white overflow-hidden relative
        flex flex-col items-center justify-center
        p-6 md:p-12
      "
    >
      <Head>
        <title>Ai-Learn - Intelligent Learning Reimagined</title>
        <meta name="description" content="Harness the power of AI to create personalized, adaptive learning paths that evolve with your knowledge and goals." />
      </Head>
      {/* Floating Particle Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * dimensions.width, 
              y: Math.random() * dimensions.height,
              opacity: 0
            }}
            animate={{ 
              x: [
                Math.random() * dimensions.width, 
                Math.random() * dimensions.width
              ],
              y: [
                Math.random() * dimensions.height, 
                Math.random() * dimensions.height
              ],
              opacity: [0, 0.2, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              repeatType: "loop"
            }}
            className="
              absolute w-2 h-2 
              bg-indigo-500/20 
              rounded-full
              blur-sm
            "
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="
          max-w-6xl mx-auto 
          grid md:grid-cols-2 gap-12 
          items-center relative z-10
        "
      >
        {/* Hero Text Section */}
        <div className="space-y-6">
          <motion.h1 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="
              text-4xl md:text-6xl font-extrabold 
              bg-clip-text text-transparent 
              bg-gradient-to-r from-indigo-500 to-purple-600
              leading-tight
            "
          >
            Intelligent Learning, 
            Reimagined
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="
              text-xl text-gray-300 
              mb-8 leading-relaxed
            "
          >
            Harness the power of AI to create personalized, adaptive learning paths 
            that evolve with your knowledge and goals.
          </motion.p>

          <div className="flex gap-4">
            <AnimatedButton 
              primary 
              onClick={() => router.push("/search")}
            >
              Start Learning
              <Zap />
            </AnimatedButton>
            <AnimatedButton 
              onClick={() => router.push("/map")}
            >
              Generate Roadmap
              <Rocket />
            </AnimatedButton>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <FeatureCard 
            icon={Sparkles}
            title="Adaptive AI"
            description="Real-time learning adaptation tailored to your progress and learning style."
          />
          <FeatureCard 
            icon={Brain}
            title="Smart Insights"
            description="Predictive analytics to optimize your learning strategy and potential."
          />
          <FeatureCard 
            icon={Rocket}
            title="Rapid Progression"
            description="Accelerate your skill acquisition with precision-engineered learning paths."
          />
          <FeatureCard 
            icon={Zap}
            title="Instant Feedback"
            description="Continuous assessment and personalized recommendations."
          />
        </div>
      </motion.div>
    </div>
  );
}