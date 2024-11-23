'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from './Footer';
import Header from './Header';
import ThemeButton from '../../components/ThemeButton';
import { useRouter } from 'next/navigation';

// Dynamically import components for better performance
const TorusSphere = dynamic(() => import('../../components/Torusphere'), { ssr: false });
const TorusSphereWeek = dynamic(() => import('../../components/TorusSphereWeek'));
const TorusSphereAll = dynamic(() => import('../../components/TorusSphereAll'));
const Profile = dynamic(() => import('./Profile'));
const Map = dynamic(() => import('./Map'));

export default function DashboardPage() {
  const [view, setView] = useState<string>('Dashboard');
  const router = useRouter(); // Create an instance of the router for navigation

  return (
    <div className="dashboard-container flex flex-col h-screen overflow-hidden bg-gradient-to-b from-pink-400 via-black to-black">
      {/* Header */}
      <Header />

      <div className="flex flex-grow overflow-hidden">
        <main className="flex-grow flex justify-center items-center">
          <div className="content-container w-full h-full p-4 flex justify-center items-center">
            {view === 'Profile' ? (
              <Profile />
            ) : view === 'Map' ? (
              <Map />
            ) : view === 'This Week' ? (
              <TorusSphereWeek />
            ) : view === 'All Time' ? (
              <TorusSphereAll />
            ) : (
              // Default View is TorusSphere (Today)
              <div className="w-full h-full">
                <TorusSphere />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bottom Navigation Bar */}
      <aside className="bottom-bar fixed bottom-16 w-full bg-black p-4 text-white flex justify-around items-center">
        <button
          onClick={() => router.push('/')} // Navigate back to Chat (Home)
          className="button-dash text-lg py-2 px-4 rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700"
        >
          Back to Chat
        </button>
        {['Today', 'This Week', 'All Time'].map((label) => (
          <button
            key={label}
            onClick={() => setView(label)}
            className={`button-dash text-lg py-2 px-4 rounded-md transition-colors ${
              view === label
                ? 'bg-orange-600 text-white animate-pulse'
                : 'bg-transparent text-gray-400 hover:bg-orange-500 hover:text-white'
            }`}
            style={{ fontWeight: view === label ? 'bold' : 'normal' }}
          >
            {label}
          </button>
        ))}
      </aside>

      {/* Theme Button */}
      <div className="absolute top-4 right-4 flex space-x-4">
        <ThemeButton />
      </div>

      {/* Footer */}
      <Footer className="p-4 md:p-8" />
    </div>
  );
}
