import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

const NeuronVisual = () => {
  const ref = useRef();
  const [wordsData, setWordsData] = useState([]);

  useEffect(() => {
    // Define the function to fetch words data from the API
    const fetchWordsData = async () => {
      try {
        const response = await fetch('/api/chat/analyzeBatch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }    

        const data = await response.json();
        setWordsData(data.keywords); // Assuming the API returns an object with a 'keywords' key
      } catch (error) {
        console.error('There was a problem with your fetch operation:', error);
      }
    };

    fetchWordsData();
  }, []);

  useEffect(() => {
    // Ensure wordsData is not empty before drawing the word cloud
    if (wordsData.length > 0) {
      drawWordCloud(wordsData);
    }
  }, [wordsData]); // Re-run this effect when wordsData changes

  const drawWordCloud = (words) => {
    // Clear the previous SVG to avoid appending a new SVG every time data updates
    d3.select(ref.current).selectAll("*").remove();

    const layout = cloud()
      .size([800, 600])
      .words(words.map(d => ({ text: d.text, size: d.frequency * 10 + 10 })))
      .padding(5)
      .rotate(() => (~~(Math.random() * 6) - 3) * 30)
      .font("Impact")
      .fontSize(d => d.size)
      .on("end", draw);

    layout.start();

    function draw(words) {
      const svg = d3.select(ref.current)
        .append("svg")
        .attr("width", layout.size()[0])
        .attr("height", layout.size()[1])
        .append("g")
        .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")");

      svg.selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", d => d.size + "px")
        .style("font-family", "Impact")
        .style("fill", d => d.sentiment === 'positive' ? "green" : "red")
        .attr("text-anchor", "middle")
        .attr("transform", d => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
        .text(d => d.text);
    }
  };

  return <div ref={ref}></div>;
};

export default NeuronVisual;
