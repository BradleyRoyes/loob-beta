import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import ThemeButton from "./ThemeButton";

const sampleWordsData = [
  { text: "happy", frequency: 20, sentiment: "positive" },
  { text: "sad", frequency: 15, sentiment: "negative" },
  { text: "love", frequency: 18, sentiment: "positive" },
  { text: "angry", frequency: 12, sentiment: "negative" },
  { text: "excited", frequency: 25, sentiment: "positive" },
];

const sampleMoodData = [
  { name: "Positive", value: 40 },
  { name: "Negative", value: 30 },
  { name: "Neutral", value: 20 },
];

const sampleSentimentData = [
  { name: "Positive", value: 25 },
  { name: "Negative", value: 15 },
  { name: "Neutral", value: 10 },
];

const sampleConversationLengthData = [
  { name: "Session 1", length: 10 },
  { name: "Session 2", length: 15 },
  { name: "Session 3", length: 8 },
  { name: "Session 4", length: 12 },
  { name: "Session 5", length: 20 },
];

const Dashboard = () => {
  const [theme, setTheme] = useState("dark");
  const [wordsData, setWordsData] = useState(sampleWordsData);
  const [moodData, setMoodData] = useState(sampleMoodData);
  const [sentimentData, setSentimentData] = useState(sampleSentimentData);
  const [conversationLengthData, setConversationLengthData] = useState(
    sampleConversationLengthData,
  );
  const wordCloudRef = useRef();
  const barChartRef = useRef();
  const lineChartRef = useRef();

  useEffect(() => {
    if (wordsData.length > 0) {
      drawWordCloud(wordsData);
    }
  }, [wordsData]);

  const drawWordCloud = (words) => {
    d3.select(wordCloudRef.current).selectAll("*").remove();

    const layout = cloud()
      .size([800, 600])
      .words(words.map((d) => ({ text: d.text, size: d.frequency * 10 + 10 })))
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
          `translate(${layout.size()[0] / 2},${layout.size()[1] / 2})`,
        );

      svg
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", (d) => d.size + "px")
        .style("font-family", "Nunito")
        .style("fill", (d) =>
          d.sentiment === "negative" ? "#9fe2bf" : "#faa0a0",
        )
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
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
            <div className="visualization-container mb-4">
              <h2 className="chatbot-text-primary text-xl mb-2">
                Mood Distribution
              </h2>
              <PieChart width={300} height={300}>
                <Pie
                  data={moodData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {moodData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={["#82ca9d", "#8884d8", "#ffc658"][index % 3]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="visualization-container mb-4">
              <h2 className="chatbot-text-primary text-xl mb-2">
                Sentiment Analysis
              </h2>
              <BarChart width={300} height={300} data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </div>
            <div className="visualization-container mb-4">
              <h2 className="chatbot-text-primary text-xl mb-2">
                Conversation Length Analysis
              </h2>
              <LineChart width={300} height={300} data={conversationLengthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="length" stroke="#8884d8" />
              </LineChart>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
