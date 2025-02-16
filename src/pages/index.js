"use client";
import "../app/globals.css";
import Image from "next/image";
import book from "../../public/ebook.svg";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const search = () => {
    router.push("/search");
  };

  const map = () => {
    router.push("/map");
  };

  const fadeIn = isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5";

  return (
    <div className="flex items-center justify-center min-h-screen p-4 md:p-10 lg:p-20 bg-gray-900 text-white">
      <div className={`flex flex-1 flex-col justify-center items-center gap-8 max-w-full md:max-w-[80%] lg:max-w-[50%] transition-all duration-500 ${fadeIn}`}>
        <h1 className="text-green-600 hover:text-green-700 duration-300 font-bold text-3xl md:text-4xl lg:text-5xl p-3  text-center leading-tight">
          Welcome To New Innovation
        </h1>
        <p className="text-gray-300 m-3 text-lg md:text-xl max-w-[90%] text-center font-sans leading-relaxed">
          AI-powered roadmaps revolutionize strategic planning by adapting in
          real-time to market shifts and user feedback, leveraging predictive
          analytics for precision.
        </p>

        <div className="flex flex-col md:flex-row gap-4 w-full items-center justify-center">
          <button
            className="relative font-semibold w-full max-sm:w-[70%] hover:scale-105 md:w-auto px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg overflow-hidden transition-all duration-300 group"
            onClick={search}
          >
           Learn Using AI
          </button>

          <button
            className="relative font-semibold  w-full max-sm:w-[70%] md:w-auto hover:scale-105 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg overflow-hidden transition-all duration-300 group"
            onClick={map}
          >
            Generate Roadmap To Learn
          </button>
        </div>
      </div>
      <div className={`hidden md:block transition-all duration-500 ${fadeIn}`}>
        <Image
          src={book}
          alt="Ebook"
          width={450}
          height={450}
          priority
          className="drop-shadow-2xl rounded-xl"
        />
      </div>
    </div>
  );
}
