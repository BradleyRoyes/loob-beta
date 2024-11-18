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
          // Detailed error for HTTP response
          throw new Error(
            `API responded with status ${response.status}: ${
              response.statusText || "Unknown Error"
            }. Please check if the API endpoint is correct or reachable.`
          );
        }

        const result = await response.json();

        // Ensure result has the expected structure
        if (!result.dailyData || !Array.isArray(result.dailyData)) {
          throw new Error(
            `Unexpected data structure from API. Expected 'dailyData' array, received: ${JSON.stringify(
              result
            )}`
          );
        }

        setData(result.dailyData);
        setIsLoading(false);
      } catch (err) {
        // Log the error and set the state
        console.error("Error fetching data:", err);
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
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
        <h2>Error Occurred</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Batch Analysis Dashboard</h1>
      {data.length === 0 ? (
        <p style={{ textAlign: "center", color: "gray" }}>No data available.</p>
      ) : (
        data.map((day, index) => (
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
        ))
      )}
    </div>
  );
};

export default Dashboard;
