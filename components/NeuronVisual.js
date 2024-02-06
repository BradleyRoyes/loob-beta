// NeuronVisual.js
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud'; // Make sure this import works in your setup

const NeuronVisual = () => {
  const ref = useRef();

  useEffect(() => {
    const drawWordCloud = (words) => {
      const layout = cloud()
        .size([800, 600])
        .words(words.map(d => ({text: d.text, size: d.frequency * 10 + 10})))
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

    // Simulate fetching words data
    const wordsData = [
      // Example data structure
      { text: "React", frequency: 10, sentiment: 'positive' },
      { text: "D3", frequency: 8, sentiment: 'positive' },
      { text: "JavaScript", frequency: 15, sentiment: 'positive' },
      // Add more words as needed
    ];

    drawWordCloud(wordsData);
  }, []);

  return <div ref={ref}></div>;
};

export default NeuronVisual;
