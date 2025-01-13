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
interface Venue {
  id: string;
  label: string;
  details: string;
  visualType: VisualView;
}

export default function Profile() {
  const { userId, setUserId, setSessionId } = useGlobalState();

  // For selecting which sphere to show
  const [visualView, setVisualView] = useState<VisualView>("Today");

  // The entries/venues from the DB
  const [venues, setVenues] = useState<Venue[]>([]);
  // If the route returns a "message" (e.g. "anonymous user" or "no entries"), store it
  const [routeMessage, setRouteMessage] = useState<string>("");

  // For the venue detail modal
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const [showVenueProfile, setShowVenueProfile] = useState(false);

  // On mount or when userId changes, fetch from /api/profile
  useEffect(() => {
    if (!userId) {
      // If userId is null, skip fetching
      setRouteMessage("No pseudonym set. Please log in or stay anonymous.");
      setVenues([]);
      return;
    }

    const fetchProfileData = async () => {
      try {
        const res = await fetch(`/api/profile?uid=${encodeURIComponent(userId)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch profile data. Status: ${res.status}`);
        }
        const data = await res.json();
        // Expecting something like { user: {...} or null, entries: [...], message?: string }

        // If the server gave a "message," store it
        if (data.message) {
          setRouteMessage(data.message);
        } else {
          setRouteMessage("");
        }

        if (data.entries && Array.isArray(data.entries)) {
          setVenues(data.entries);
        } else {
          setVenues([]);
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setRouteMessage("Error fetching entries from server.");
        setVenues([]);
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

  // Open/close the venue modal
  const openVenueProfile = (venue: Venue) => {
    setActiveVenue(venue);
    setShowVenueProfile(true);
  };
  const closeVenueProfile = () => {
    setActiveVenue(null);
    setShowVenueProfile(false);
  };

  // For logging out, we clear the global user
  const handleLogout = () => {
    setUserId(null);
    setSessionId(null);
    // Possibly remove local/session storage if you used it
    // e.g. localStorage.removeItem("userId");
    window.location.reload();
  };

  return (
    <div className="profile-container">
      <main className="profile-main">
        <div className="profile-content-wrapper">
          {/* Show user pseudonym or fallback */}
          <section className="pseudonym-section">
            <p className="pseudonym-label">Pseudonym:</p>
            <p className="pseudonym-value">{userId ?? "No pseudonym set"}</p>
            {/* If route returned a special message (e.g. "You are anonymous..."), show it */}
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

          {/* Venues/Entries */}
          <section className="your-venues-section">
            <h2 className="venues-heading">Your Venues</h2>
            <ul className="venues-list">
              {venues.map((v) => (
                <li key={v.id} className="venue-item">
                  <span className="venue-label">{v.label}</span>
                  <button onClick={() => openVenueProfile(v)}>Open</button>
                </li>
              ))}
              {venues.length === 0 && (
                <p className="no-venues">You have no venues yet.</p>
              )}
            </ul>
          </section>

          {/* Log Out button */}
          <button className="logout-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </main>

      {/* Venue Profile Modal */}
      {showVenueProfile && activeVenue && (
        <VenueProfile venue={activeVenue} onClose={closeVenueProfile} />
      )}
    </div>
  );
}
