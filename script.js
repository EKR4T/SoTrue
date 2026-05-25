/*
================================================================================
    MINI SOLAR SYSTEM SIMULATOR - 3D-STYLE ORBITS, MAJOR MOONS, FULLSCREEN UI

    - Pseudo-3D projection (tilted orbital planes)
    - Depth-sorted rendering (far -> near)
    - Labels rendered as DOM overlay to avoid squeezed text
    - Fullscreen toggle and minimal icon toolbar
================================================================================
*/

// Canvas + overlay
const canvas = document.getElementById('solarSystemCanvas');
const canvasWrap = document.getElementById('canvasWrap');
const labelsOverlay = document.getElementById('labelsOverlay');
const tooltip = document.getElementById('tooltip');
const ctx = canvas.getContext('2d');

// create persistent Earth label element
const earthLabelEl = document.createElement('div');
earthLabelEl.className = 'label earth-label';
earthLabelEl.textContent = '♁ Earth';
labelsOverlay.appendChild(earthLabelEl);

// create persistent Sun label element
const sunLabelEl = document.createElement('div');
sunLabelEl.className = 'label sun-label';
sunLabelEl.textContent = '☀ Sun';
labelsOverlay.appendChild(sunLabelEl);

// Projection tuning
let FOCAL_LENGTH = 1200;

// Global camera rotation (user-controllable)
let globalYaw = 0;   // rotation around Y axis
let globalTilt = -0.25; // rotation around X axis (negative tilts toward top)

// Drag state for tilting
let isDragging = false;
let lastDragX = 0;
let lastDragY = 0;

let centerX = 0;
let centerY = 0;

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(300, canvasWrap.clientWidth);
    const cssH = Math.max(200, canvasWrap.clientHeight);
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // regenerate starfield for new size
    generateStars(cssW, cssH);
}

window.addEventListener('resize', resizeCanvas);
document.addEventListener('fullscreenchange', () => setTimeout(resizeCanvas, 60));
// initial resize will be invoked after star functions are defined

// Simulation state
let isRunning = true;
let showOrbits = true;
let simulationTime = 0;
let speed = 1.0;
// orbit display modes: 0 = hidden, 1 = dashed (default), 2 = solid highlighted
let orbitMode = 1;

// Sun
const sun = { radius: 30, color: '#FDB813', glowColor: '#FFA500' };

// starfield (generated per-canvas-size)
let stars = [];
function generateStars(w, h) {
    stars = [];
    const area = w * h;
    const count = Math.max(80, Math.min(700, Math.floor(area / 4500)));
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.6 + 0.2,
            baseAlpha: 0.15 + Math.random() * 0.9,
            depth: 0.2 + Math.random() * 0.9, // 0.2 (near) -> 1.1 (far)
            twinkleSpeed: 0.6 + Math.random() * 1.6,
            twinklePhase: Math.random() * Math.PI * 2
        });
    }
}

function drawStarfield(w, h, yaw = 0, tilt = 0, time = 0) {
    // subtle space gradient (deep space)
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#00020a');
    g.addColorStop(1, '#000814');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // parallax factors (pixels per radian * depth)
    const pxFactor = 28; // horizontal sensitivity
    const pyFactor = 20; // vertical sensitivity

    ctx.save();
    for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const offsetX = yaw * pxFactor * s.depth;
        const offsetY = tilt * pyFactor * s.depth;
        const sx = s.x + offsetX;
        const sy = s.y + offsetY;

        // twinkle modulation (0.4..1.0)
        const tw = 0.5 + 0.5 * Math.abs(Math.sin(time * s.twinkleSpeed + s.twinklePhase));
        const alpha = Math.max(0, Math.min(1, s.baseAlpha * tw));

        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, s.r * (0.6 + 0.8 * s.depth), 0, Math.PI * 2);
        ctx.fill();

        // occasional subtle flare for nearer bright stars
        if (s.depth < 0.45 && Math.random() < 0.002) {
            ctx.globalAlpha = Math.min(1, alpha * 2);
            ctx.beginPath();
            ctx.arc(sx, sy, s.r * 2.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
}

// Planets with major moons (visual selection, not exhaustive)
const planets = [
    { name: 'Mercury', symbol: '☿', orbitRadius: 90, currentAngle: Math.random()*Math.PI*2, angularVelocity: 0.045, radius:5, color:'#8C7853', inclination:0.12, showTrail:false, trail:[], moons:[{name:'Mercury-I', orbitRadius:12, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.12, radius:1.6, color:'#d9d9d9'}] },
    { name: 'Venus', symbol: '♀', orbitRadius: 130, currentAngle: Math.random()*Math.PI*2, angularVelocity:0.025, radius:8, color:'#FFC649', inclination:0.06, showTrail:false, trail:[], moons:[{name:'Venus-I', orbitRadius:14, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.09, radius:1.8, color:'#e8e0d6'}] },
    { name:'Earth', symbol:'♁', orbitRadius:170, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.018, radius:8, color:'#4CAF50', inclination:0.0, showTrail:true, trail:[], moons:[{name:'Moon', orbitRadius:24, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.08, radius:4, color:'#CCCCCC'}] },
    { name:'Mars', symbol:'♂', orbitRadius:210, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.012, radius:6, color:'#E27B58', inclination:0.05, showTrail:false, trail:[], moons:[{name:'Phobos', orbitRadius:18, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.11, radius:3, color:'#D9D9D9'},{name:'Deimos', orbitRadius:24, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.09, radius:2.2, color:'#cfcfcf'}] },
    { name:'Jupiter', symbol:'♃', orbitRadius:270, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.005, radius:14, color:'#DAA520', inclination:0.03, showTrail:false, trail:[], moons:[{name:'Io', orbitRadius:24, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.032, radius:5, color:'#F9E79F'},{name:'Europa', orbitRadius:34, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.025, radius:4.2, color:'#e6eef8'},{name:'Ganymede', orbitRadius:44, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.018, radius:6, color:'#d1c6b0'},{name:'Callisto', orbitRadius:54, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.014, radius:5.6, color:'#bfae9f'}] },
    { name:'Saturn', symbol:'♄', orbitRadius:330, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.003, radius:12, color:'#F4A460', inclination:0.04, hasRings:true, showTrail:false, trail:[], moons:[{name:'Titan', orbitRadius:28, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.022, radius:5, color:'#F0E68C'},{name:'Rhea', orbitRadius:36, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.018, radius:3.8, color:'#ddd3b8'}] },
    { name:'Uranus', symbol:'♅', orbitRadius:380, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.002, radius:10, color:'#4FD0E7', inclination:0.08, showTrail:false, trail:[], moons:[{name:'Ariel', orbitRadius:18, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.025, radius:4, color:'#B3E5FC'},{name:'Titania', orbitRadius:26, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.02, radius:3.6, color:'#cbeef6'}] },
    { name:'Neptune', symbol:'♆', orbitRadius:430, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.0015, radius:10, color:'#4169E1', inclination:0.04, showTrail:false, trail:[], moons:[{name:'Triton', orbitRadius:24, currentAngle:Math.random()*Math.PI*2, angularVelocity:0.02, radius:4, color:'#A9CCE3'}] }
];

// Main animation
function animate() {
    // compute current CSS-size center
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    centerX = cssW / 2;
    centerY = cssH / 2;

        // background (starfield) with parallax + twinkle
        drawStarfield(cssW, cssH, globalYaw, globalTilt, simulationTime);

    // APPLICATION: update angles + compute 3D-like positions
    if (isRunning) {
        planets.forEach(planet => {
            planet.currentAngle += planet.angularVelocity * speed;
            const xPlane = planet.orbitRadius * Math.cos(planet.currentAngle);
            const yPlane = planet.orbitRadius * Math.sin(planet.currentAngle);
            const inc = planet.inclination || 0;
            // initial tilted plane coords
            let x3 = xPlane;
            let y3 = yPlane * Math.cos(inc);
            let z3 = yPlane * Math.sin(inc);

            // apply global yaw (Y-axis) rotation
            const cosy = Math.cos(globalYaw);
            const siny = Math.sin(globalYaw);
            const rx = x3 * cosy + z3 * siny;
            const rz = -x3 * siny + z3 * cosy;

            // apply global tilt (X-axis) rotation
            const cost = Math.cos(globalTilt);
            const sint = Math.sin(globalTilt);
            const ry = y3 * cost - rz * sint;
            const rz2 = y3 * sint + rz * cost;

            x3 = rx; y3 = ry; z3 = rz2;

            // prevent z getting too close to focal plane
            const zMax = FOCAL_LENGTH - 40;
            if (z3 > zMax) z3 = zMax;
            if (z3 < -zMax) z3 = -zMax;

            const scale = FOCAL_LENGTH / (FOCAL_LENGTH - z3);
            const px = centerX + x3 * scale;
            const py = centerY + y3 * scale;
            planet.position = { x: px, y: py, z: z3, scale };

            if (planet.showTrail) {
                planet.trail.push({ x: px, y: py });
                if (planet.trail.length > 160) planet.trail.shift();
            }

            if (planet.moons) {
                planet.moons.forEach(moon => {
                    moon.currentAngle += moon.angularVelocity * speed;
                    const mx = px + moon.orbitRadius * Math.cos(moon.currentAngle) * (0.9 + 0.2 * Math.cos(planet.currentAngle));
                            // apply same global rotations to moon local offsets
                            // start with local offset relative to planet in plane coords
                            let mxPlane = moon.orbitRadius * Math.cos(moon.currentAngle);
                            let myPlane = moon.orbitRadius * Math.sin(moon.currentAngle) * Math.cos(inc);
                            let mzPlane = moon.orbitRadius * Math.sin(moon.currentAngle) * Math.sin(inc);

                            // rotate local moon offset by global yaw
                            const mxr = mxPlane * cosy + mzPlane * siny;
                            const mzr = -mxPlane * siny + mzPlane * cosy;
                            // rotate by global tilt
                            const myr = myPlane * cost - mzr * sint;
                            const mzr2 = myPlane * sint + mzr * cost;

                            const my = py + mxr; // note: mx already included px, but we use mxr for additional offset
                            const mz = z3 + mzr2;
                    moon.position = { x: mx, y: my, z: mz, scale: FOCAL_LENGTH / (FOCAL_LENGTH - mz) };
                });
            }
        });

        simulationTime += speed;
    }

    // GEOMETRY: draw projected orbits
    if (orbitMode !== 0) {
        planets.forEach(planet => {
            // choose color/alpha based on mode
            const color = orbitMode === 2 ? 'rgba(76,175,80,0.12)' : '#1a3a52';
            drawProjectedOrbit(centerX, centerY, planet.orbitRadius, planet.inclination || 0, color, globalYaw, orbitMode);
            if (planet.moons) planet.moons.forEach(m => drawEllipse(planet.position.x, planet.position.y, m.orbitRadius, m.orbitRadius * Math.cos(planet.inclination || 0), 'rgba(153,153,153,0.08)'));
        });
    }

    // draw trails
    planets.forEach(p => p.showTrail && drawTrail(p.trail, p.color));

    // RASTERIZATION: depth-sort bodies and render
    drawSun(centerX, centerY, sun.radius, sun.color, sun.glowColor);

    const bodies = [];
    planets.forEach(p => { if (p.position) bodies.push({type:'planet', obj:p, z:p.position.z}); if (p.moons) p.moons.forEach(m => bodies.push({type:'moon', obj:m, parent:p, z:m.position ? m.position.z : (p.position ? p.position.z : 0)})); });
    bodies.sort((a,b) => (a.z||0) - (b.z||0));

    bodies.forEach(item => {
        if (item.type === 'planet') {
            const p = item.obj;
            if (!p.position) return;
            if (p.hasRings) drawPlanetWithRings(p.position.x, p.position.y, p.radius, p.color, p.position.scale);
            else drawPlanet(p.position.x, p.position.y, p.radius, p.color, p.position.scale);
        } else {
            const m = item.obj;
            if (!m.position) return;
            drawPlanet(m.position.x, m.position.y, m.radius, m.color, m.position.scale);
        }
    });

    // tooltip/hover handled by pointer events (DOM overlay)

        // update persistent Earth label position
        const earth = planets.find(p => p.name === 'Earth');
        const earthLabelEl = document.querySelector('.earth-label');
        if (earth && earth.position && earthLabelEl) {
            earthLabelEl.style.left = `${Math.min(Math.max(earth.position.x, 6), canvas.clientWidth - 60)}px`;
            earthLabelEl.style.top = `${earth.position.y - (earth.radius * 2 + 8)}px`;
            earthLabelEl.style.display = 'block';
        } else if (earthLabelEl) {
            earthLabelEl.style.display = 'none';
        }

        // update persistent Sun label position
        const sunLabelEl = document.querySelector('.sun-label');
        if (sunLabelEl) {
            const sx = Math.min(Math.max(centerX, 6), canvas.clientWidth - 60);
            const sy = Math.max(8, centerY - (sun.radius + 16));
            sunLabelEl.style.left = `${sx}px`;
            sunLabelEl.style.top = `${sy}px`;
            sunLabelEl.style.display = 'block';
        }

        // basic overlap avoidance: nudge Earth label away from toolbar and Sun label
        try {
            const toolbar = document.querySelector('.toolbar');
            const earthEl = document.querySelector('.earth-label');
            const sunEl = document.querySelector('.sun-label');
            if (earthEl && sunEl) {
                const tRect = toolbar ? toolbar.getBoundingClientRect() : null;
                const eRect = earthEl.getBoundingClientRect();
                const sRect = sunEl.getBoundingClientRect();

                // if earth overlaps toolbar, push it down or right
                if (tRect && rectsOverlap(eRect, tRect)) {
                    earthEl.style.top = (parseFloat(earthEl.style.top || 0) + Math.max(22, tRect.height)) + 'px';
                }

                // if earth overlaps sun, push earth to the right
                if (rectsOverlap(eRect, sRect)) {
                    earthEl.style.left = (parseFloat(earthEl.style.left || 0) + Math.max(34, sRect.width)) + 'px';
                }
            }
        } catch (err) { /* non-fatal */ }

    document.getElementById('timeDisplay').textContent = Math.floor(simulationTime);
    document.getElementById('speedDisplay').textContent = speed.toFixed(1);

    requestAnimationFrame(animate);
}

// RENDERING HELPERS
function drawSun(x,y,radius,color,glowColor) {
    const outer = radius * 3;
    const g = ctx.createRadialGradient(x,y,0,x,y,outer);
    g.addColorStop(0, glowColor);
    g.addColorStop(0.4, color);
    g.addColorStop(1, 'rgba(255,165,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x,y,outer,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x,y,radius,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#FFFF00'; ctx.beginPath(); ctx.arc(x,y,radius*0.6,0,Math.PI*2); ctx.fill();
}

function drawPlanet(x,y,radius,color,scale=1) {
    const r = Math.max(1, radius * Math.max(0.6, scale));
    // lighting: highlight toward sun (which is at centerX,centerY)
    const lx = centerX - x;
    const ly = centerY - y;
    const ld = Math.sqrt(lx*lx + ly*ly) || 1;
    const nx = lx/ld, ny = ly/ld;
    const hx = x + nx * r * 0.45;
    const hy = y + ny * r * 0.45;
    const grad = ctx.createRadialGradient(hx, hy, Math.max(1,r*0.1), x, y, r*1.4);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.25, color);
    grad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.beginPath(); ctx.fillStyle = grad; ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    // subtle rim
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.globalAlpha = 0.6; ctx.stroke(); ctx.globalAlpha = 1;
}

function drawPlanetWithRings(x,y,radius,color,scale=1) {
    const r = Math.max(1, radius * Math.max(0.6, scale));
    ctx.save(); ctx.strokeStyle = 'rgba(244,164,96,0.6)'; ctx.lineWidth = Math.max(2, 4*Math.min(1, scale)); ctx.beginPath(); ctx.ellipse(x,y,r*2.3,r*0.7,0.45,0,Math.PI*2); ctx.stroke(); ctx.restore();
    drawPlanet(x,y,radius,color,scale);
}

function drawProjectedOrbit(cx,cy,radius,inclination,color,rotation=0, mode=1) {
    ctx.save();
    ctx.strokeStyle = color;
    // mode 1: dashed, mode 2: solid highlighted
    if (mode === 1) {
        ctx.lineWidth = 1;
        ctx.setLineDash([6,6]);
        ctx.globalAlpha = 0.85;
    } else {
        ctx.lineWidth = 2.2;
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.9;
        // add a faint glow for highlighted mode
        ctx.shadowColor = 'rgba(76,175,80,0.12)';
        ctx.shadowBlur = 8;
    }
    const rx = radius;
    const ry = Math.max(2, radius * Math.cos(inclination||0));
    ctx.beginPath();
    ctx.ellipse(cx,cy,rx,ry,rotation,0,Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawEllipse(cx,cy,rx,ry,color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); ctx.stroke(); ctx.restore();
}

function drawTrail(trail,color){ if(!trail||trail.length<2) return; ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=2; ctx.globalAlpha=0.5; trail.forEach((pt,i)=>{ if(i===0) ctx.moveTo(pt.x,pt.y); else ctx.lineTo(pt.x,pt.y); }); ctx.stroke(); ctx.globalAlpha=1; }

// tooltip hover - single DOM element reused (declared near top)
let hoveredBody = null;

function hideTooltip() {
    tooltip.style.display = 'none';
    hoveredBody = null;
}

function showTooltipFor(body, px, py) {
    if (!body) { hideTooltip(); return; }
    const text = body.type === 'planet' ? `${body.obj.symbol || ''} ${body.obj.name}`.trim() : `🌙 ${body.obj.name}`;
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    // position above the body
    const offX = Math.min(Math.max(px, 10), canvas.clientWidth - 150);
    const offY = Math.max(8, py - 28);
    tooltip.style.left = offX + 'px';
    tooltip.style.top = offY + 'px';
    hoveredBody = body;
}

// helper: rect overlap test
function rectsOverlap(a, b) {
    if (!a || !b) return false;
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

// hit testing on pointer move
canvas.addEventListener('pointermove', (e) => {
    // get pointer in canvas CSS coords
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // build bodies sorted by nearest (largest scale) and z (near first)
    const list = [];
    planets.forEach(p => { if (p.position) list.push({type:'planet', obj:p, z:p.position.z, x:p.position.x, y:p.position.y, r: p.radius * (p.position.scale||1) }); if (p.moons) p.moons.forEach(m => { if (m.position) list.push({type:'moon', obj:m, parent:p, z:m.position.z, x:m.position.x, y:m.position.y, r: m.radius * (m.position.scale||1)}); }); });
    // sort by z descending (near first)
    list.sort((a,b) => (b.z||0) - (a.z||0));

    let found = null;
    for (const item of list) {
        const dx = px - item.x;
        const dy = py - item.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist <= Math.max(4, item.r * 1.2)) { found = item; break; }
    }

    if (found) {
        showTooltipFor(found, found.x, found.y - (found.r || 0));
    } else {
        hideTooltip();
    }
});

canvas.addEventListener('pointerleave', () => hideTooltip());

// Drag handlers for tilt
canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastDragX;
    const dy = e.clientY - lastDragY;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    // adjust yaw and tilt with sensitivity
    globalYaw += dx * 0.005;
    globalTilt += dy * 0.004;
    // clamp tilt to avoid flipping
    globalTilt = Math.max(-1.2, Math.min(1.2, globalTilt));
});

canvas.addEventListener('pointerup', (e) => {
    isDragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
});

canvas.addEventListener('pointercancel', () => { isDragging = false; });

// touch gestures handled by pointer events; double-click resets
canvas.addEventListener('dblclick', () => { globalYaw = 0; globalTilt = -0.25; });

// Ctrl+wheel to zoom perspective; otherwise wheel adjusts speed as before
canvas.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        FOCAL_LENGTH = Math.max(300, Math.min(3000, FOCAL_LENGTH + (e.deltaY > 0 ? -50 : 50)));
    }
});

// EVENT HANDLERS + UI
const pausePlayBtn = document.getElementById('pausePlayBtn');
const resetBtn = document.getElementById('resetBtn');
const toggleOrbitsBtn = document.getElementById('toggleOrbitsBtn');
const fullScreenBtn = document.getElementById('fullScreenBtn');

pausePlayBtn.addEventListener('click', ()=>{ isRunning = !isRunning; pausePlayBtn.textContent = isRunning ? '⏸' : '▶'; });
resetBtn.addEventListener('click', ()=>{ simulationTime = 0; planets.forEach(p=>{ p.currentAngle = Math.random()*Math.PI*2; p.trail = []; if(p.moons) p.moons.forEach(m=>m.currentAngle = Math.random()*Math.PI*2); }); isRunning = true; pausePlayBtn.textContent='⏸'; });
toggleOrbitsBtn.addEventListener('click', ()=>{
    orbitMode = (orbitMode + 1) % 3;
    if (orbitMode === 0) toggleOrbitsBtn.textContent = '🚫';
    else if (orbitMode === 1) toggleOrbitsBtn.textContent = '👁';
    else toggleOrbitsBtn.textContent = '⭐';

    // enable orbit tracing for all planets when orbits visible
    const trailsOn = orbitMode !== 0;
    planets.forEach(p => {
        p.showTrail = trailsOn;
        if (!trailsOn) p.trail = [];
    });
});
fullScreenBtn.addEventListener('click', async ()=>{ try{ if(!document.fullscreenElement) { await canvasWrap.requestFullscreen(); fullScreenBtn.textContent='⤢'; } else { await document.exitFullscreen(); fullScreenBtn.textContent='⛶'; } } catch(e){ console.warn('Fullscreen failed', e); } });

window.addEventListener('keydown', (e)=>{ if (e.key === '+' || e.key === '=') speed = Math.min(speed+0.2,5); else if (e.key === '-' || e.key === '_') speed = Math.max(speed-0.2,0.2); });
canvas.addEventListener('wheel', (e)=>{ if (e.ctrlKey) return; e.preventDefault(); speed = Math.max(0.2, Math.min(5, speed + (e.deltaY < 0 ? 0.1 : -0.1))); });

// Start
resizeCanvas();
animate();

console.log('%c📊 GRAPHICS PIPELINE STAGES:', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
console.log('%cAPPLICATION STAGE:', 'color: #2196F3; font-weight: bold;', 'Physics & orbital updates (3D tilt)');
console.log('%cGEOMETRY STAGE:', 'color: #FF9800; font-weight: bold;', 'Projected orbit vertex calculations');
console.log('%cRASTERIZATION STAGE:', 'color: #F44336; font-weight: bold;', 'Canvas rendering, gradients, DOM labels');
