import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';
import { PieChart, Pie, Cell } from 'recharts';

// Sample data for word cloud
const sampleWordsData = [
  { text: 'happy', frequency: 20, sentiment: 'positive' },
  { text: 'sad', frequency: 15, sentiment: 'negative' },
  { text: 'love', frequency: 18, sentiment: 'positive' },
  { text: 'angry', frequency: 12, sentiment: 'negative' },
  { text: 'excited', frequency: 25, sentiment: 'positive' },
];

// Sample data for pie chart
const sampleMoodData = [
  { name: 'Positive', value: 40 },
  { name: 'Negative', value: 30 },
  { name: 'Neutral', value: 20 },
];

const Dashboard = () => {
  const [wordsData, setWordsData] = useState(sampleWordsData);
  const [moodData, setMoodData] = useState(sampleMoodData);
  const ref = useRef();

  useEffect(() => {
    if (wordsData.length > 0) {
      drawWordCloud(wordsData);
    }
  }, [wordsData]);

  const drawWordCloud = (words) => {
    d3.select(ref.current).selectAll('*').remove();

    const layout = cloud()
      .size([800, 600])
      .words(words.map(d => ({ text: d.text, size: d.frequency * 10 + 10 })))
      .padding(5)
      .rotate(() => (~~(Math.random() * 6) - 3) * 30)
      .font('Impact')
      .fontSize(d => d.size)
      .on('end', draw);

    layout.start();

    function draw(words) {
      const svg = d3.select(ref.current)
        .append('svg')
        .attr('width', layout.size()[0])
        .attr('height', layout.size()[1])
        .append('g')
        .attr('transform', `translate(${layout.size()[0] / 2},${layout.size()[1] / 2})`);

      svg.selectAll('text')
        .data(words)
        .enter().append('text')
        .style('font-size', d => d.size + 'px')
        .style('font-family', 'Impact')
        .style('fill', d => (d.sentiment === 'positive' ? 'green' : 'red'))
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
        .text(d => d.text);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <section className="chatbot-section w-full md:origin-w-[800px] md:w-full md:h-full rounded-md p-2 md:p-6">
        <h1 className="chatbot-text-primary text-6xl md:text-7xl font-extrabold tracking-wide mb-6">
          Journaling Dashboard
        </h1>
        <div className="flex flex-col items-center">
          <div className="mb-6 w-full">
            <h2 className="chatbot-text-primary text-3xl mb-2">Word Cloud</h2>
            <div ref={ref} style={{ maxWidth: '100%', overflowX: 'auto' }}></div>
          </div>
          <div className="w-full">
            <h2 className="chatbot-text-primary text-3xl mb-2">Mood Distribution</h2>
            <PieChart width={400} height={300} style={{ margin: '0 auto' }}>
              <Pie
                data={moodData}
                cx={200}
                cy={150}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {moodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['green', 'red', 'blue'][index]} />
                ))}
              </Pie>
            </PieChart>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
