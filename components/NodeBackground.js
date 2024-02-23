// NodeBackground.js
export default function sketch(p) {
  let gnodes = [];
  let maxNodes = 100; // Adjust based on performance

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background(0);
    p.noFill();
    p.strokeWeight(1);
    p.ellipseMode(p.RADIUS);
    p.frameRate(30);

    for (let i = 0; i < maxNodes; i++) {
      gnodes.push(new Node(p.random(p.width), p.random(p.height), p.random(1, 2)));
    }
  };

  p.draw = () => {
    p.background(0, 0, 0, 25); // Use transparency for trails

    gnodes.forEach(node => {
      node.move();
      node.display();
    });

    for (let i = 0; i < gnodes.length; i++) {
      for (let j = i + 1; j < gnodes.length; j++) {
        let distance = p.dist(gnodes[i].x, gnodes[i].y, gnodes[j].x, gnodes[j].y);
        if (distance < 50) {
          p.stroke(255, p.map(distance, 0, 50, 255, 0));
          p.line(gnodes[i].x, gnodes[i].y, gnodes[j].x, gnodes[j].y);
        }
      }
    }
  };

  class Node {
    constructor(x, y, radius) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.velocity = p.createVector(p.random(-1, 1), p.random(-1, 1));
    }

    move() {
      this.x += this.velocity.x;
      this.y += this.velocity.y;

      if (this.x < 0 || this.x > p.width) this.velocity.x *= -1;
      if (this.y < 0 || this.y > p.height) this.velocity.y *= -1;
    }

    display() {
      p.stroke(255);
      p.fill(255);
      p.ellipse(this.x, this.y, this.radius, this.radius);
    }
  }
}
