import React, { useState, useCallback, useRef, useEffect } from 'react';
import './GameOfLife.css';

interface Props {
  onClose: () => void;
}

const GameOfLife: React.FC<Props> = ({ onClose }) => {
  const [grid, setGrid] = useState<boolean[][]>(() => {
    const rows = 50;
    const cols = 50;
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => false)
    );
  });

  const [isRunning, setIsRunning] = useState(false);
  const runningRef = useRef(isRunning);
  runningRef.current = isRunning;

  const runSimulation = useCallback(() => {
    if (!runningRef.current) return;

    setGrid((g) => {
      const newGrid = g.map((row, i) => {
        return row.map((cell, j) => {
          let neighbors = 0;
          // Check all 8 neighbors
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue;
              const newI = i + di;
              const newJ = j + dj;
              if (newI >= 0 && newI < g.length && newJ >= 0 && newJ < g[0].length) {
                neighbors += g[newI][newJ] ? 1 : 0;
              }
            }
          }

          // Apply Conway's Game of Life rules
          if (cell) {
            return neighbors === 2 || neighbors === 3;
          } else {
            return neighbors === 3;
          }
        });
      });
      return newGrid;
    });

    setTimeout(runSimulation, 150); // Slightly slower for better visualization
  }, []);

  const handleCellClick = (i: number, j: number) => {
    setGrid(g => {
      const newGrid = g.map(row => [...row]);
      newGrid[i][j] = !newGrid[i][j];
      return newGrid;
    });
  };

  const clearGrid = () => {
    setGrid(grid.map(row => row.map(() => false)));
  };

  const randomizeGrid = () => {
    setGrid(grid.map(row => row.map(() => Math.random() > 0.85)));
  };

  useEffect(() => {
    if (isRunning) {
      runSimulation();
    }
  }, [isRunning, runSimulation]);

  return (
    <div className="game-of-life-container">
      <div className="game-header">
        <h2>Conway's Game of Life</h2>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      <div className="controls">
        <button 
          className="control-button"
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
        <button className="control-button" onClick={clearGrid}>Clear</button>
        <button className="control-button" onClick={randomizeGrid}>Randomize</button>
      </div>

      <div className="main-content">
        <div className="grid-container">
          <div className="grid">
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`cell ${cell ? 'alive' : ''}`}
                  onClick={() => handleCellClick(i, j)}
                />
              ))
            )}
          </div>
        </div>

        <div className="instructions">
          <p>Click cells to toggle their state. Rules:</p>
          <ul>
            <li>Any live cell with fewer than two live neighbors dies</li>
            <li>Any live cell with two or three live neighbors lives</li>
            <li>Any live cell with more than three live neighbors dies</li>
            <li>Any dead cell with exactly three live neighbors becomes alive</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameOfLife; 