import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";
import axios from "axios";
import ThemeButton from "./ThemeButton";

const Dashboard = () => {
  const [theme, setTheme] = useState("dark");
  const [wordsData, setWordsData] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [conversationLengthData, setConversationLengthData] = useState([]);
  const wordCloudRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get("/api/chat/DataPull");
      const { mood, keywords } = response.data;
      setMoodData(mood);
      setWordsData(keywords);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (wordsData.length > 0) {
      drawWordCloud(wordsData);
    }
  }, [wordsData]);

  const drawWordCloud = (words) => {
    d3.select(wordCloudRef.current).selectAll("*").remove();

    const container = wordCloudRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const layout = cloud()
      .size([containerWidth, containerHeight])
      .words(
        words.map((d) => ({
          text: d.text,
          size: d.frequency * 3 + 3,
          sentiment: d.sentiment,
        }))
      )
      .padding(5)
      .rotate(() => (~~(Math.random() * 6) - 3) * 30)
      .font("Impact")
      .fontSize((d) => d.size)
      .on("end", draw);

    layout.start();

    function draw(words) {
      const svg = d3
        .select(wordCloudRef.current)
        .append("svg")
        .attr("width", layout.size()[0])
        .attr("height", layout.size()[1])
        .append("g")
        .attr(
          "transform",
          `translate(${layout.size()[0] / 2},${layout.size()[1] / 2})`
        );

      svg
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", (d) => d.size + "px")
        .style("font-family", "Nunito")
        .style("fill", (d) => {
          if (d.sentiment === "positive") {
            return "#9fe2bf";
          } else if (d.sentiment === "negative") {
            return "#faa0a0";
          } else {
            return "#6B6F73";
          }
        })
        .attr("text-anchor", "middle")
        .attr(
          "transform",
          (d) => `translate(${[d.x, d.y]})rotate(${d.rotate})`
        )
        .text((d) => d.text);
    }
  };

  return (
    <main
      className={`flex flex-col items-center justify-center min-h-screen py-4 ${
        theme === "dark" ? "dark" : "light"
      }`}
    >
      <section className="chatbot-section max-w-4xl w-full overflow-hidden rounded-md shadow-lg">
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="chatbot-text-primary text-3xl font-bold">
              Dashboard
            </h1>
            <ThemeButton theme={theme} setTheme={setTheme} />
          </div>
          <div className="flex flex-wrap justify-around">
            <div className="visualization-container mb-4">
              <h2 className="chatbot-text-primary text-xl mb-2">
                Common words
              </h2>
              <div ref={wordCloudRef} className="word-cloud-container" />
            </div>
            {/* Add other visualizations here */}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
