const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const { createNoise3D } = require('simplex-noise');

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  fps: 60,
  duration: Infinity
};

let minFrequency = 0.5;
let maxFrequency = 2;
let minAmplitude = 0.05;
let maxAmplitude = 0.5;

// Initialize Simplex noise (version 4.x API)
const noise3D = createNoise3D();

const sketch = ({ width, height, canvas }) => {
  // Style body and html for centering
  if (typeof document !== 'undefined') {
    // Set page title
    document.title = 'Perceived Activity at Certain Time';
    
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.minHeight = '100vh';
    document.body.style.background = 'white';
    if (document.documentElement) {
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
    }
  }
  
  // Mouse interactivity removed - using fixed values
  
  // Center and style the canvas
  canvas.style.margin = '0 auto';
  canvas.style.display = 'block';
  canvas.style.borderRadius = '3px';
  canvas.style.boxShadow = '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)';

  return ({ context, width, height, time }) => {
    // Clear canvas
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    // Calculate time-of-day activity multiplier (0 at midnight, 1 at midday)
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60; // Include minutes for smoother transition
    // Use cosine to create smooth curve: 0 at midnight, 1 at noon, 0 at midnight
    const timeOfDayMultiplier = (Math.cos((hour - 12) / 12 * Math.PI) + 1) / 2;

    // Use fixed frequency and amplitude (middle values)
    const frequency = (minFrequency + maxFrequency) / 2;
    let amplitude = (minAmplitude + maxAmplitude) / 2;
    
    // Apply time-of-day multiplier to amplitude (0 at midnight = no waves, 1 at midday = full waves)
    amplitude *= timeOfDayMultiplier;
    
    const dim = Math.min(width, height);
    
    // Set drawing style
    context.strokeStyle = 'black';
    context.lineWidth = dim * 0.002;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    const rows = 10;
    const cols = 10;
    const timeValue = time * 0.5;

    // Draw horizontal waves (left to right)
    for (let y = 0; y < rows; y++) {
      // Determine the Y position of the line
      const v = rows <= 1 ? 0.5 : y / (rows - 1);
      const py = v * height;
      
      drawNoiseLine(context, {
        v,
        start: [ 0, py ],
        end: [ width, py ],
        amplitude: amplitude * height,
        frequency,
        time: timeValue,
        steps: 150,
        horizontal: true
      });
    }

    // Draw vertical waves (top to bottom)
    for (let x = 0; x < cols; x++) {
      // Determine the X position of the line
      const u = cols <= 1 ? 0.5 : x / (cols - 1);
      const px = u * width;
      
      drawNoiseLine(context, {
        v: u,
        start: [ px, 0 ],
        end: [ px, height ],
        amplitude: amplitude * width,
        frequency,
        time: timeValue,
        steps: 150,
        horizontal: false
      });
    }
  };
};

function drawNoiseLine(context, opt = {}) {
  const {
    v,
    start,
    end,
    steps = 10,
    frequency = 1,
    time = 0,
    amplitude = 1,
    horizontal = true
  } = opt;
  
  const [ xStart, yStart ] = start;
  const [ xEnd, yEnd ] = end;

  // Create a line by walking N steps and interpolating
  // from start to end point at each interval
  context.beginPath();
  for (let i = 0; i < steps; i++) {
    // Get interpolation factor between 0..1
    const t = steps <= 1 ? 0.5 : i / (steps - 1);

    // Interpolate X position
    let x = lerp(xStart, xEnd, t);
    
    // Interpolate Y position
    let y = lerp(yStart, yEnd, t);
    
    // Apply noise based on direction
    if (horizontal) {
      // Horizontal waves: offset Y position
      y += noise3D(t * frequency + time, v * frequency, time) * amplitude;
    } else {
      // Vertical waves: offset X position
      x += noise3D(v * frequency, t * frequency + time, time) * amplitude;
    }
    
    // Place vertex
    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }
  context.stroke();
}

canvasSketch(sketch, settings);
