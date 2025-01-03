'use client';

import React from 'react';
import { GlobalStateProvider } from '../components/GlobalStateContext';
import 'app/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GlobalStateProvider>
          {children}
        </GlobalStateProvider>
      </body>
    </html>
  );
}
