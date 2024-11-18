import React, { useEffect, useState } from "react";

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/chat/batchanalyze");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        setData(result.dailyData || []); // Assuming the data format matches your batch API
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ textAlign: "center", padding: "20px", color: "red" }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>Batch Analysis Dashboard</h1>
      {data.length === 0 ? (
        <p style={{ textAlign: "center", color: "gray" }}>No data available.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.map((day, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "10px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <h3>Date: {day.day}</h3>
              <p>
                <strong>Average Mood Score:</strong> {day.averageMood.toFixed(2)}
              </p>
              <p>
                <strong>Keywords:</strong>{" "}
                {day.keywords && day.keywords.length > 0
                  ? day.keywords.join(", ")
                  : "No keywords"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
