import React, { useEffect, useRef } from "react";

const Dashboard = () => {
  const canvasRef = useRef(null);

  class Branch {
    constructor(
      startX,
      startY,
      angle,
      speed,
      depth = 0,
      maxDepth = 10,
      color = "rgba(0, 100, 0, 0.8)",
    ) {
      this.startX = startX;
      this.startY = startY;
      this.angle = angle;
      this.speed = speed;
      this.depth = depth;
      this.maxDepth = maxDepth;
      this.color = color;
    }

    grow(branches) {
      if (this.depth < this.maxDepth) {
        const endX = this.startX + Math.cos(this.angle) * this.speed;
        const endY = this.startY + Math.sin(this.angle) * this.speed;
        const newBranch = new Branch(
          endX,
          endY,
          this.angle + (Math.random() - 0.5) * 0.4,
          this.speed * 0.99,
          this.depth + 1,
          this.maxDepth,
          this.color,
        );
        branches.push(newBranch);

        // Optionally add a branching mechanism
        if (Math.random() < 0.05 && this.depth > 2) {
          // Adjust branching probability
          branches.push(
            new Branch(
              endX,
              endY,
              this.angle + (Math.random() * Math.PI) / 2,
              this.speed * 0.6,
              this.depth + 1,
              this.maxDepth,
              this.color,
            ),
          );
          branches.push(
            new Branch(
              endX,
              endY,
              this.angle - (Math.random() * Math.PI) / 2,
              this.speed * 0.6,
              this.depth + 1,
              this.maxDepth,
              this.color,
            ),
          );
        }
      }
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.moveTo(this.startX, this.startY);
      ctx.lineTo(
        this.startX + Math.cos(this.angle) * 20,
        this.startY + Math.sin(this.angle) * 20,
      );
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(1, this.maxDepth - this.depth);
      ctx.stroke();
    }
  }

  class MovingPoint {
    constructor(x, y, speed, angle) {
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.angle = angle;
    }

    move() {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
    }

    draw(ctx) {
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let branches = [
      new Branch(
        canvas.width / 2,
        canvas.height - 20,
        -Math.PI / 2,
        10,
        0,
        10,
        "rgba(0, 100, 0, 0.8)",
      ),
    ];
    let movingPoints = [
      new MovingPoint(canvas.width / 2, canvas.height - 20, 2, -Math.PI / 2),
    ];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

      branches.forEach((branch) => {
        branch.draw(ctx);
        branch.grow(branches);
      });

      movingPoints.forEach((point) => {
        point.move();
        point.draw(ctx);
      });

      requestAnimationFrame(draw);
    };

    draw();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-4 dark">
      <section className="chatbot-section max-w-4xl w-full overflow-hidden rounded-md shadow-lg">
        <div className="p-4">
          <h1 className="chatbot-text-primary text-3xl font-bold">Dashboard</h1>
          <div className="visualization-container mb-4">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
