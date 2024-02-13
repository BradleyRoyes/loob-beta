// Step 1: Import necessary libraries and components
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import ThemeButton from "./ThemeButton";

// Step 2: Define sample data for the dashboard's visualizations
const sampleWordsData = [
  { text: "happy", frequency: 20, sentiment: "positive" },
  { text: "sad", frequency: 15, sentiment: "negative" },
  { text: "love", frequency: 18, sentiment: "positive" },
  { text: "angry", frequency: 12, sentiment: "negative" },
  { text: "excited", frequency: 25, sentiment: "positive" },
];

const sampleMoodData = [
  { name: "Positive", value: 63 },
  { name: "Negative", value: 37 },
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
  const [activeTab, setActiveTab] = useState('insights');

  // Simplified content rendering function
  const renderContent = () => {
    switch (activeTab) {
      case 'insights':
        return renderInsights();
      case 'map':
        return <div className="tab-content">Map feature is planned.</div>;
      case 'settings':
        return <div className="tab-content">Settings will be available here.</div>;
      default:
        return <div className="tab-content">This tab&aposs content is under development.</div>;
    }
  };

  // Function to render the insights tab
  const renderInsights = () => {
    return (
      <>
        {/* Mood Distribution Pie Chart */}
        <div className="visualization-container">
          <h2>Mood Distribution</h2>
          <PieChart width={400} height={400}>
            <Pie data={sampleMoodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} fill="#8884d8" label>
              {sampleMoodData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28'][index % 3]}/>
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
        {/* Sentiment Analysis Bar Chart */}
        <div className="visualization-container">
          <h2>Sentiment Analysis</h2>
          <BarChart width={500} height={300} data={sampleSentimentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#82ca9d" />
          </BarChart>
        </div>
        {/* Conversation Length Line Chart */}
        <div className="visualization-container">
          <h2>Conversation Length Analysis</h2>
          <LineChart width={500} height={300} data={sampleConversationLengthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="length" stroke="#8884d8" />
          </LineChart>
        </div>
      </>
    );
  };

  return (
    <main className={`dashboard ${theme}`}>
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <ThemeButton theme={theme} setTheme={setTheme} />
      </header>
      <div className="content">
        {renderContent()}
      </div>
      <footer className="bottom-nav">
        <button onClick={() => setActiveTab('insights')}>Insights</button>
        <button onClick={() => setActiveTab('map')}>Map</button>
        <button onClick={() => setActiveTab('settings')}>Settings</button>
      </footer>
    </main>
  );
};

export default Dashboard;