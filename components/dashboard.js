import React, { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";
import * as d3 from "d3";
import cloud from "d3-cloud";

const Dashboard = () => {
  const canvasRef = useRef(null);
  const [keywordData, setKeywordData] = useState([]); // For word cloud
  const [sentimentData, setSentimentData] = useState([]); // For sentiment trends
  const [engagementMetrics, setEngagementMetrics] = useState({ attendees: 0, interactions: 0 });
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Track if data is being received

  // Fetch initial data from the route
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/chat"); // Matches the `GET` route in route.ts
        const data = await response.json();

        setSentimentData(data.moodData);
        setKeywordData(data.keywordData);
        setEngagementMetrics(data.engagementMetrics || { attendees: 0, interactions: 0 });
        setIsDataLoaded(true); // Data loaded successfully
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setIsDataLoaded(false); // Indicate data load failure
      }
    }
    fetchData();
  }, []);

  // Initialize Pusher for real-time updates
  useEffect(() => {
    const pusher = new Pusher("facc28e7df1eec1d7667", {
      cluster: "eu",
      encrypted: true,
    });

    const channel = pusher.subscribe("dashboard-updates");
    channel.bind("data-update", (data) => {
      console.log("Real-time update received:", data);
      if (data.moodData) setSentimentData(data.moodData);
      if (data.keywordData) setKeywordData(data.keywordData);
      if (data.engagementMetrics) setEngagementMetrics(data.engagementMetrics);
      setIsDataLoaded(true); // Indicate successful update
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  // Draw Word Cloud
  const drawWordCloud = () => {
    const svgRef = document.querySelector("#wordcloud");
    if (!svgRef) return;

    const layout = cloud()
      .size([400, 300])
      .words(
        keywordData.map(({ keyword, count }) => ({
          text: keyword,
          size: Math.sqrt(count) * 10, // Scale font size by count
        }))
      )
      .padding(5)
      .rotate(() => (Math.random() > 0.5 ? 90 : 0))
      .font("sans-serif")
      .fontSize((d) => d.size)
      .on("end", draw);

    layout.start();

    function draw(words) {
      const svg = d3.select(svgRef).attr("width", layout.size()[0]).attr("height", layout.size()[1]);
      svg.selectAll("*").remove();

      svg
        .append("g")
        .attr("transform", `translate(${layout.size()[0] / 2}, ${layout.size()[1] / 2})`)
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", (d) => `${d.size}px`)
        .style("font-family", "sans-serif")
        .style("fill", () => `hsl(${Math.random() * 360}, 100%, 50%)`)
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
        .text((d) => d.text);
    }
  };

  // Redraw word cloud when keyword data changes
  useEffect(() => {
    drawWordCloud();
  }, [keywordData]);

  return (
    <div
      style={{
        padding: "20px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
      }}
    >
      {/* Data Status Indicator */}
      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50px",
          borderRadius: "8px",
          background: isDataLoaded ? "#D4EDDA" : "#F8D7DA",
          color: isDataLoaded ? "#155724" : "#721C24",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        {isDataLoaded ? "Data Loaded Successfully 🎉" : "Loading Data... 🔄"}
      </div>

      {/* Sentiment Chart Panel */}
      <div
        style={{
          border: "2px solid black",
          borderRadius: "8px",
          padding: "20px",
          background: "#f7f7f7",
        }}
      >
        <h2>Sentiment Trends</h2>
        <svg id="sentiment-chart" width="100%" height="300px"></svg>
        {sentimentData.map((data, idx) => (
          <div key={idx}>
            <strong>{data.mood}</strong>: {data.count}
          </div>
        ))}
      </div>

      {/* Engagement Metrics */}
      <div
        style={{
          border: "2px solid black",
          borderRadius: "8px",
          padding: "20px",
          background: "#f7f7f7",
        }}
      >
        <h2>Engagement Metrics</h2>
        <p>Attendees: {engagementMetrics.attendees}</p>
        <p>Interactions: {engagementMetrics.interactions}</p>
      </div>

      {/* Word Cloud Panel */}
      <div
        style={{
          border: "2px solid black",
          borderRadius: "8px",
          padding: "20px",
          background: "#f7f7f7",
        }}
      >
        <h2>Trending Topics</h2>
        <svg id="wordcloud"></svg>
      </div>
    </div>
  );
};

export default Dashboard;
