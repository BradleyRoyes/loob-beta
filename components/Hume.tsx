import React from "react";
import dynamic from "next/dynamic";

const TestHume = dynamic(() => import("../test_hume/app/page"), {
  ssr: false, // Disable server-side rendering for this component
});

const HumeApp = () => {
  return (
    <div>
      <h1>Hume App Embedded</h1>
      <TestHume />
    </div>
  );
};

export default HumeApp;
