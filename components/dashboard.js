import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './Dashboard.css'; // Ensure you've created this CSS file with the provided styles

// Mock data for charts
const moodData = [
  { name: "Positive", value: 63 },
  { name: "Negative", value: 37 },
];

const sentimentData = [
  { name: "Session 1", value: 240 },
  { name: "Session 2", value: 456 },
  { name: "Session 3", value: 139 },
];

// Colors for pie chart
const COLORS = ['#FFBB28', '#FF8042'];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="dashboard">
      <div className="profile">
        <div className="profile-info">
          <img src="/path-to-your-profile-image.jpg" alt="Profile" className="profile-pic" />
          <h1>User Name</h1>
        </div>
      </div>

      <div className="content">
        {activeTab === 'home' && (
          <>
            <h2>Journal Insights</h2>
            <div className="charts">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={moodData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={renderCustomizedLabel}>
                    {moodData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Additional charts or visualizations can be similarly added */}
          </>
        )}

        {activeTab === 'map' && (
          <div className="map-feature">
            {/* Placeholder for map feature */}
            <h2>Map Feature Coming Soon!</h2>
          </div>
        )}

        {/* Additional tabs content */}
      </div>

      <nav className="bottom-nav">
        <button onClick={() => setActiveTab('home')}>Home</button>
        <button onClick={() => setActiveTab('map')}>Map</button>
        <button onClick={() => setActiveTab('settings')}>Settings</button>
      </nav>
    </div>
  );
};

export default Dashboard;
