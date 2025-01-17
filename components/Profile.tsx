"use client";

import React, { useEffect, useState } from "react";
import { useGlobalState } from "./GlobalStateContext"; // Adjust path if needed
import TorusSphere from "./TorusSphere";
import TorusSphereWeek from "./TorusSphereWeek";
import TorusSphereAll from "./TorusSphereAll";
import VenueProfile from "./VenueProfile";
import "./Profile.css"; // Keep your existing styling

type VisualView = "Today" | "ThisWeek" | "AllTime";

// Represents one doc fetched from your DB
interface Entry {
  id: string;
  label: string;
  details: string;
}

interface Loobricate {
  id: string;
  name: string;
  description: string;
}

interface RecentDiscovery {
  id: string;
  type: "content" | "loobricate" | "location";
  title: string;
  dateVisited: string;
}

export default function Profile() {
  const { userId, setUserId, setSessionId } = useGlobalState();

  // For selecting which sphere to show
  const [visualView, setVisualView] = useState<VisualView>("Today");

  // Data states
  const [loobricates, setLoobricates] = useState<Loobricate[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [recentDiscoveries, setRecentDiscoveries] = useState<RecentDiscovery[]>([]);
  const [routeMessage, setRouteMessage] = useState<string>("");

  useEffect(() => {
    if (!userId) {
      setRouteMessage("No pseudonym set. Please log in or stay anonymous.");
      setLoobricates([]);
      setEntries([]);
      setRecentDiscoveries([]);
      return;
    }

    const fetchProfileData = async () => {
      try {
        const res = await fetch(`/api/profile?uid=${encodeURIComponent(userId)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch profile data. Status: ${res.status}`);
        }
        const data = await res.json();

        setRouteMessage(data.message || "");
        setLoobricates(data.loobricates || []);
        setEntries(data.entries || []);
        setRecentDiscoveries(data.recentDiscoveries || []);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setRouteMessage("Error fetching entries from server.");
        setLoobricates([]);
        setEntries([]);
        setRecentDiscoveries([]);
      }
    };

    fetchProfileData();
  }, [userId]);

  // Toggle the sphere view
  const renderSphereForView = () => {
    switch (visualView) {
      case "ThisWeek":
        return <TorusSphereWeek />;
      case "AllTime":
        return <TorusSphereAll />;
      default:
        return <TorusSphere />;
    }
  };

  // For logging out, we clear the global user
  const handleLogout = () => {
    setUserId(null);
    setSessionId(null);
    window.location.reload();
  };

  return (
    <div className="profile-container">
      <main className="profile-main">
        <div className="profile-content-wrapper">
          {/* User Pseudonym */}
          <section className="pseudonym-section">
            <p className="pseudonym-label">Pseudonym:</p>
            <p className="pseudonym-value">{userId ?? "No pseudonym set"}</p>
            {routeMessage && (
              <p className="route-message" style={{ marginTop: "0.5rem", color: "#888" }}>
                {routeMessage}
              </p>
            )}
          </section>

          {/* Visualization toggles */}
          <section className="visual-toggles">
            {(["Today", "ThisWeek", "AllTime"] as VisualView[]).map((view) => (
              <button
                key={view}
                onClick={() => setVisualView(view)}
                className={visualView === view ? "active-toggle" : ""}
              >
                {view}
              </button>
            ))}
          </section>

          {/* Spheres */}
          <section className="visualization-section">
            {renderSphereForView()}
          </section>

          {/* Loobricates */}
          <section className="your-loobricates-section">
            <h2 className="section-heading">Your Loobricates</h2>
            <ul className="list">
              {loobricates.length > 0 ? (
                loobricates.map((l) => (
                  <li key={l.id} className="list-item">
                    <span>{l.name}</span>
                    <p>{l.description}</p>
                  </li>
                ))
              ) : (
                <p className="empty-message">You are not part of any Loobricates yet.</p>
              )}
            </ul>
          </section>

          {/* Loobrary Entries */}
          <section className="your-loobrary-entries-section">
            <h2 className="section-heading">Your Loobrary Entries</h2>
            <ul className="list">
              {entries.length > 0 ? (
                entries.map((e) => (
                  <li key={e.id} className="list-item">
                    <span>{e.label}</span>
                    <p>{e.details}</p>
                  </li>
                ))
              ) : (
                <p className="empty-message">You have not added any entries to the Loobrary yet.</p>
              )}
            </ul>
          </section>

          {/* Recent Discoveries */}
          <section className="recent-discoveries-section">
            <h2 className="section-heading">Recent Discoveries</h2>
            <ul className="list">
              {recentDiscoveries.length > 0 ? (
                recentDiscoveries.map((r) => (
                  <li key={r.id} className="list-item">
                    <span>{r.title}</span>
                    <p>Visited on: {new Date(r.dateVisited).toLocaleDateString()}</p>
                  </li>
                ))
              ) : (
                <p className="empty-message">You have no recent discoveries yet.</p>
              )}
            </ul>
          </section>

          {/* Log Out button */}
          <button className="logout-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </main>
    </div>
  );
}
