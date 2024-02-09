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

  // Simplified example to visualize JSON messages
  useEffect(() => {
    if (jsonMessages && jsonMessages.length > 0) {
      drawWordCloud(jsonMessages);
    }
  }, [jsonMessages]);

  const drawWordCloud = (messages) => {
    const layout = cloud()
      .size([800, 400])
      .words(
        messages.map((d) => ({
          text: d.keywords.join(" "), // Assuming 'keywords' field exists and is an array
          size: 10 + Math.random() * 90, // Random size for demonstration
        }))
      )
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
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
        .attr("transform", (d) => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
        .text((d) => d.text);
    }
  };

  return (
    <main className={`flex flex-col items-center justify-center min-h-screen py-4 ${theme === "dark" ? "dark" : "light"}`}>
      <ThemeButton theme={theme} setTheme={setTheme} />
      <section className="max-w-4xl w-full overflow-hidden rounded-md shadow-lg p-4">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div ref={wordCloudRef} className="word-cloud-container" />
        {/* Additional visualization components can go here */}
        {/* Simple JSON display for debug */}
        <div className="json-messages-display mt-4">
          <h2>Raw JSON Messages</h2>
          <pre>{JSON.stringify(jsonMessages, null, 2)}</pre>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
