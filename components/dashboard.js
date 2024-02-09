import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import ThemeButton from "./ThemeButton";

const Dashboard = ({ jsonMessages }) => {
  const [theme, setTheme] = useState("dark");
  const wordCloudRef = useRef();
  const [keywordsData, setKeywordsData] = useState([]);
  const [moodData, setMoodData] = useState([]);

  useEffect(() => {
    // Process jsonMessages to extract and aggregate keywords and moods
    const keywordsFrequency = {};
    const moodCount = { Positive: 0, Negative: 0, Neutral: 0 };

    jsonMessages.forEach((message) => {
      message.keywords.forEach((keyword) => {
        keywordsFrequency[keyword] = (keywordsFrequency[keyword] || 0) + 1;
      });

      moodCount[message.mood] = (moodCount[message.mood] || 0) + 1;
    });

    // Convert aggregated data into arrays for visualization
    const keywordsArray = Object.keys(keywordsFrequency).map((key) => ({
      text: key,
      value: keywordsFrequency[key],
    }));

    const moodArray = Object.keys(moodCount).map((key) => ({
      name: key,
      value: moodCount[key],
    }));

    setKeywordsData(keywordsArray);
    setMoodData(moodArray);

    // Draw word cloud
    drawWordCloud(keywordsArray);
  }, [jsonMessages]);

  const drawWordCloud = (keywords) => {
    const layout = cloud()
      .size([800, 400])
      .words(keywords.map((d) => ({ text: d.text, size: d.value * 10 }))) // Adjust size multiplier as needed
      .padding(5)
      .rotate(0)
      .font("Impact")
      .fontSize((d) => d.size)
      .on("end", (words) => {
        renderWordCloud(words);
      });

    layout.start();

    function renderWordCloud(words) {
      d3.select(wordCloudRef.current).selectAll("*").remove(); // Clear previous

      const svg = d3.select(wordCloudRef.current).append("svg")
        .attr("width", layout.size()[0])
        .attr("height", layout.size()[1])
        .append("g")
        .attr("transform", `translate(${layout.size()[0] / 2}, ${layout.size()[1] / 2})`);

      svg.selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", (d) => `${d.size}px`)
        .style("font-family", "Impact")
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${[d.x, d.y]})`)
        .text((d) => d.text);
    }
  };

  return (
    <main className={`flex flex-col items-center justify-center min-h-screen py-4 ${theme === "dark" ? "dark" : "light"}`}>
      <ThemeButton theme={theme} setTheme={setTheme} />
      <section className="max-w-4xl w-full overflow-hidden rounded-md shadow-lg p-4">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div ref={wordCloudRef} className="word-cloud-container mb-4" />
        <div className="pie-chart-container">
          <PieChart width={400} height={400}>
            <Pie data={moodData} cx={200} cy={200} outerRadius={100} fill="#8884d8" dataKey="value" label>
              {moodData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={["#0088FE", "#00C49F", "#FFBB28"][index % 3]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
