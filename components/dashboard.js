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

const Dashboard = ({ jsonMessages }) => {
  const [theme, setTheme] = useState("dark");
  const wordCloudRef = useRef();
  const [moodData, setMoodData] = useState([]);
  const [keywordsData, setKeywordsData] = useState([]);

  useEffect(() => {
    // Aggregate keywords and mood counts from jsonMessages
    const keywordCounts = {};
    const moodCounts = { Positive: 0, Negative: 0, Neutral: 0 };

    jsonMessages.forEach((msg) => {
      msg.keywords.forEach((keyword) => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
      moodCounts[msg.mood] += 1;
    });

    const processedKeywordsData = Object.keys(keywordCounts).map((key) => ({
      text: key,
      value: keywordCounts[key], // Adjust the value for display size in the word cloud
    }));

    const processedMoodData = Object.keys(moodCounts).map((mood) => ({
      name: mood,
      value: moodCounts[mood],
    }));

    setKeywordsData(processedKeywordsData);
    setMoodData(processedMoodData);

    drawWordCloud(processedKeywordsData);
  }, [jsonMessages]);

  const drawWordCloud = (keywords) => {
    d3.select(wordCloudRef.current).selectAll("*").remove(); // Clear the existing word cloud

    const layout = cloud()
      .size([800, 400])
      .words(keywords.map((d) => ({ text: d.text, size: d.value * 10 }))) // Scale the size based on frequency
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
      .font("Impact")
      .fontSize((d) => d.size)
      .on("end", (words) => {
        const svg = d3.select(wordCloudRef.current)
          .append("svg")
          .attr("width", layout.size()[0])
          .attr("height", layout.size()[1])
          .append("g")
          .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")");

        svg.selectAll("text")
          .data(words)
          .enter().append("text")
          .style("font-size", (d) => d.size + "px")
          .style("font-family", "Impact")
          .attr("text-anchor", "middle")
          .attr("transform", (d) => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
          .text((d) => d.text);
      });

    layout.start();
  };

  return (
    <main className={`flex flex-col items-center justify-center min-h-screen py-4 ${theme === "dark" ? "dark" : "light"}`}>
      <ThemeButton theme={theme} setTheme={setTheme} />
      <section className="max-w-4xl w-full overflow-hidden rounded-md shadow-lg p-4">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div ref={wordCloudRef} className="word-cloud-container mb-4"></div>
        <div className="visualization-container mb-4">
          <PieChart width={400} height={400}>
            <Pie data={moodData} cx="200" cy="200" outerRadius={100} fill="#8884d8" dataKey="value" label>
              {moodData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={["#82ca9d", "#8884d8", "#ffc658"][index % 3]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
        {/* Other visualizations like BarChart and LineChart can be similarly updated */}
      </section>
    </main>
  );
};

export default Dashboard;
