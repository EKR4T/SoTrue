# 🌍 Mini Solar System Simulator - Graphics Pipeline Demo

## 📋 Overview

This is a **graphics pipeline demonstration** built with **HTML5 Canvas, CSS, and JavaScript** using **Express.js**. The application clearly shows all three stages of the graphics pipeline:

1. **APPLICATION STAGE** 📊: Physics calculations, orbital mechanics, angular velocity, and coordinate transformations
2. **GEOMETRY STAGE** 🔷: Circle vertex generation using parametric equations (sin/cos), coordinate system conversions (polar → Cartesian)
3. **RASTERIZATION STAGE** 🎨: Canvas pixel rendering, shape filling with gradients, and visual effects

## 🎯 Assignment Requirements Met

✅ **HTML5 Canvas + CSS + JavaScript**  
✅ **Demonstrates all 3 graphics pipeline stages with clear comments**  
✅ **Contains 3 objects**: Sun, Planet, Moon  
✅ **Express.js backend**  
✅ **Ready for Vercel deployment**  
✅ **Creative & interactive Solar System Simulator**  

## 🌟 Features

### Objects
- **☀️ Sun**: Static glowing circle at center with radial gradient effect
- **🌍 Planet**: Orbits the sun with calculated angular velocity and orbital mechanics
- **🌙 Moon**: Orbits the planet (bonus feature), demonstrating orbital hierarchies

### Interactive Controls
- **⏸ Pause/Play**: Control simulation
- **🔄 Reset**: Return to initial state
- **👁 Toggle Orbits**: Show/hide orbital paths
- **+/- Keys**: Speed up/slow down simulation
- **Real-time Stats**: Display simulation time and speed multiplier

### Visual Effects
- Dark space background gradient
- Glowing sun with radial gradient
- Dashed orbital paths
- Smooth animations with requestAnimationFrame
- Responsive design

## 📁 Project Structure

```
d:\CS Documents\SoTrue\
├── index.js                 # Express server entry point
├── package.json             # Dependencies & scripts
├── vercel.json              # Vercel deployment configuration
├── README.md                # This file
├── public/
│   ├── index.html           # Main HTML with Canvas
│   ├── script.js            # Graphics pipeline implementation
│   └── styles.css           # Styling & animations
└── routes/
    └── routes.js            # API routes
```

## 🔴 Graphics Pipeline Implementation

### APPLICATION STAGE (Physics & Transformations)
```javascript
// Angular velocity calculations
planet.currentAngle += planet.angularVelocity * speed;

// Velocity vector calculations
planet.velocity = {
    x: nextX - planetX,
    y: nextY - planetY
};
```

### GEOMETRY STAGE (Vertex Generation)
```javascript
// Convert polar coordinates to Cartesian using parametric equations
const planetX = centerX + planet.orbitRadius * Math.cos(planet.currentAngle);
const planetY = centerY + planet.orbitRadius * Math.sin(planet.currentAngle);
```

### RASTERIZATION STAGE (Canvas Rendering)
```javascript
// Draw with gradients and pixel filling
ctx.fillStyle = gradient;
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();  // Rasterize to canvas pixels
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 14+ installed
- npm or yarn package manager

### Local Development

1. **Clone/Download the repository**
   ```bash
   cd "d:\CS Documents\SoTrue"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm start
   ```
   
   Server runs at `http://localhost:83`

4. **Open in browser**
   ```
   http://localhost:83/home
   ```

## 🌐 Deployment to Vercel

### Step 1: Prepare for Deployment
```bash
# Ensure all dependencies are installed
npm install

# Remove Vercel if previously installed
npm uninstall vercel
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
npm install -g vercel
vercel
```
Follow the prompts and select your project settings.

**Option B: Using Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import the GitHub repository
5. Click "Deploy"

### Step 3: Access Your Deployment
- Production URL: `https://your-project-name.vercel.app/home`
- Check the Vercel dashboard for real-time logs

## 📊 Key Code Sections (Pipeline Stages)

### application.js - Lines marked with:
- 🖥️ **APPLICATION STAGE**: Physics calculations (lines with `// Update planet orbit`)
- 🔷 **GEOMETRY STAGE**: Vertex generation (lines with `Math.cos`, `Math.sin`)
- 🎨 **RASTERIZATION STAGE**: Canvas operations (all `ctx.` calls)

## 🎮 How to Use

1. **Start the simulation** - Use Play/Pause button
2. **Adjust speed** - Press `+` to speed up, `-` to slow down
3. **Visualize orbits** - Toggle Orbits to see planetary paths
4. **Reset** - Click Reset to return to initial state
5. **Check console** - Open browser DevTools to see graphics pipeline breakdown

## 💡 Creative Aspects

- **Realistic orbital mechanics**: Angular velocity-based motion
- **Visual effects**: Glowing sun with radial gradient
- **Hierarchical orbits**: Moon orbits planet, planet orbits sun
- **Interactive controls**: Play, pause, speed adjustment
- **Educational focus**: Clear comments explaining each pipeline stage
- **Responsive design**: Works on desktop and mobile

## 📝 Comments in Code

The code is extensively commented to show:
- Where APPLICATION STAGE occurs (physics calculations)
- Where GEOMETRY STAGE occurs (vertex generation with trigonometry)
- Where RASTERIZATION STAGE occurs (Canvas rendering)

Each section is marked with:
```javascript
// ============================================================
// 📍 APPLICATION STAGE: Physics & Transformations
// ============================================================
```

## 🐛 Troubleshooting

### Port 83 already in use
Change in `index.js`:
```javascript
const PORT = process.env.PORT || 3000; // Change to any free port
```

### Canvas not rendering
- Check browser console for errors (F12)
- Ensure JavaScript is enabled
- Clear browser cache

### Vercel deployment failed
- Ensure `vercel.json` exists and is properly formatted
- Check that all dependencies are in `package.json`
- Verify Express server runs locally first

## 📚 Resources

- **HTML5 Canvas API**: [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- **Graphics Pipeline**: [Learn Graphics](https://learnopengl.com/Getting-started/Graphics-Pipeline)
- **Express.js**: [Official Docs](https://expressjs.com)
- **Vercel**: [Deployment Guide](https://vercel.com/docs)

## ✅ Assignment Checklist

- [x] GitHub repository created with all files
- [x] HTML5 Canvas + CSS + JavaScript implementation
- [x] Demonstrates Application stage (physics & transformations)
- [x] Demonstrates Geometry stage (vertex generation)
- [x] Demonstrates Rasterization stage (canvas rendering)
- [x] Contains 2+ objects (Sun, Planet, Moon)
- [x] Clear code comments for each pipeline stage
- [x] Creative Solar System Simulator design
- [x] Interactive controls and features
- [x] Deployed on Vercel (GitHub Pages alternative)
- [x] README with explanation

## 📬 Submission Details

**Due**: 26th May 11:59pm  
**Format**: GitHub repository + Vercel deployment link  
**Note**: This counts as attendance for Monday virtual class on 18th May

---

**Created with ❤️ for Graphics Pipeline Assignment**
