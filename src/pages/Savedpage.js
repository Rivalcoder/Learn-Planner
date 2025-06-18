import { useState, useEffect } from "react";
import Head from "next/head";

export default function Home() {
  const [headings, setHeadings] = useState([]);
  const [selectedHeading, setSelectedHeading] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    // Load headings from localStorage or set default data
    const storedData = localStorage.getItem("mytadata");
    if (storedData) {
      setHeadings(JSON.parse(storedData));
    } else {
      const defaultHeadings = [
        {
          heading: "Programming",
          topics: [
            {
              topic: "JavaScript",
              subTopics: ["Variables", "Functions", "Loops"],
            },
            {
              topic: "Python",
              subTopics: ["Lists", "Dictionaries", "Loops"],
            },
          ],
        },
        {
          heading: "Web Development",
          topics: [
            {
              topic: "HTML",
              subTopics: ["Tags", "Attributes", "Forms"],
            },
            {
              topic: "CSS",
              subTopics: ["Selectors", "Flexbox", "Grid"],
            },
          ],
        },
      ];
      localStorage.setItem("mytaskdata", JSON.stringify(defaultHeadings));
      setHeadings(defaultHeadings);
    }
  }, []);

  const handleHeadingClick = (headingName) => {
    setSelectedHeading(headingName);
    setSelectedTopic(null);
  };

  const handleTopicClick = (topicName) => {
    setSelectedTopic(topicName);
  };

  const addTopic = (newTopic) => {
    if (!newTopic.trim() || !selectedHeading) return;

    const updatedHeadings = headings.map((h) =>
      h.heading === selectedHeading
        ? { ...h, topics: [...h.topics, { topic: newTopic, subTopics: [] }] }
        : h
    );

    setHeadings(updatedHeadings);
    localStorage.setItem("mytaskdata", JSON.stringify(updatedHeadings));
  };

  const addSubTopic = (newSubTopic) => {
    if (!newSubTopic.trim() || !selectedHeading || !selectedTopic) return;

    const updatedHeadings = headings.map((h) =>
      h.heading === selectedHeading
        ? {
            ...h,
            topics: h.topics.map((t) =>
              t.topic === selectedTopic
                ? { ...t, subTopics: [...t.subTopics, newSubTopic] }
                : t
            ),
          }
        : h
    );

    setHeadings(updatedHeadings);
    localStorage.setItem("mytaskdata", JSON.stringify(updatedHeadings));
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <Head>
        <title>Saved Page</title>
      </Head>
      <h2>Headings</h2>
      <ul>
        {headings.map((heading, index) => (
          <li
            key={index}
            onClick={() => handleHeadingClick(heading.heading)}
            style={{
              cursor: "pointer",
              fontWeight: selectedHeading === heading.heading ? "bold" : "normal",
              color: selectedHeading === heading.heading ? "blue" : "black",
            }}
          >
            {heading.heading}
          </li>
        ))}
      </ul>

      {selectedHeading && (
        <div style={{ marginTop: "20px" }}>
          <h3>Topics in {selectedHeading}</h3>
          <ul>
            {headings
              .find((h) => h.heading === selectedHeading)
              ?.topics.map((topic, index) => (
                <li
                  key={index}
                  onClick={() => handleTopicClick(topic.topic)}
                  style={{
                    cursor: "pointer",
                    fontWeight: selectedTopic === topic.topic ? "bold" : "normal",
                    color: selectedTopic === topic.topic ? "green" : "black",
                  }}
                >
                  {topic.topic}
                </li>
              ))}
          </ul>
          <input type="text" placeholder="Add a new topic" id="topicInput" />
          <button
            onClick={() => {
              addTopic(document.getElementById("topicInput").value);
              document.getElementById("topicInput").value = "";
            }}
          >
            Add Topic
          </button>
        </div>
      )}

      {selectedTopic && (
        <div style={{ marginTop: "20px" }}>
          <h3>Subtopics in {selectedTopic}</h3>
          <ul>
            {headings
              .find((h) => h.heading === selectedHeading)
              ?.topics.find((t) => t.topic === selectedTopic)
              ?.subTopics.map((sub, subIndex) => (
                <li key={subIndex}>{sub}</li>
              ))}
          </ul>
          <input type="text" placeholder="Add a new subtopic" id="subTopicInput" />
          <button
            onClick={() => {
              addSubTopic(document.getElementById("subTopicInput").value);
              document.getElementById("subTopicInput").value = "";
            }}
          >
            Add Subtopic
          </button>
        </div>
      )}
    </div>
  );
}
