// ============================================
// FILE: src/worlds/World1/BounceOrBreak.js
// ============================================

import React, { useState, useRef } from 'react';
import './BounceOrBreak.css';

const BounceOrBreak = ({ onComplete, navigate }) => {
  const [selectedBall, setSelectedBall] = useState(null);
  const [selectedSurface, setSelectedSurface] = useState(null);
  const [dropHeight, setDropHeight] = useState(2);
  const [isDropping, setIsDropping] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [experiments, setExperiments] = useState([]);
  const [currentExperiment, setCurrentExperiment] = useState(null);
  const [activeTab, setActiveTab] = useState('experiment');
  const [liveMeasurements, setLiveMeasurements] = useState({
    velocity: 0,
    height: 0,
    energy: 0,
    cor: 0,
    bounceCount: 0
  });
  const [bounceHistory, setBounceHistory] = useState([]);
  const [bounceIntensity, setBounceIntensity] = useState('medium');
  const [showParticles, setShowParticles] = useState(false);
  const [trailPositions, setTrailPositions] = useState([]);
  const [isBallOnSurface, setIsBallOnSurface] = useState(false);

  const ballRef = useRef(null);
  const surfaceRef = useRef(null);

  // Physics Constants
  const GRAVITY = 9.81;

  // Ball Properties
  const balls = [
    {
      id: 'superball',
      name: 'Super Ball',
      emoji: '🔴',
      color: '#EF4444',
      mass: 0.05,
      elasticity: 0.92,
      classification: 'Highly Elastic',
      description: 'Excellent energy retention'
    },
    {
      id: 'basketball',
      name: 'Basketball',
      emoji: '🏀',
      color: '#F59E0B',
      mass: 0.62,
      elasticity: 0.76,
      classification: 'Elastic',
      description: 'Good bounce characteristics'
    },
    {
      id: 'tennisball',
      name: 'Tennis Ball',
      emoji: '🎾',
      color: '#10B981',
      mass: 0.058,
      elasticity: 0.73,
      classification: 'Moderately Elastic',
      description: 'Medium energy return'
    },
    {
      id: 'clayball',
      name: 'Clay Ball',
      emoji: '🟤',
      color: '#A16207',
      mass: 0.15,
      elasticity: 0.15,
      classification: 'Inelastic',
      description: 'Poor energy retention'
    },
    {
      id: 'putty',
      name: 'Silly Putty',
      emoji: '🟣',
      color: '#8B5CF6',
      mass: 0.1,
      elasticity: 0.02,
      classification: 'Highly Inelastic',
      description: 'Minimal bounce'
    }
  ];

  // Surface Properties
  const surfaces = [
    {
      id: 'steel',
      name: 'Steel Plate',
      emoji: '🔩',
      color: '#6B7280',
      energyReturn: 0.96,
      classification: 'Very Hard',
      description: 'Excellent energy return'
    },
    {
      id: 'concrete',
      name: 'Concrete',
      emoji: '🏗️',
      color: '#9CA3AF',
      energyReturn: 0.85,
      classification: 'Hard',
      description: 'Good energy return'
    },
    {
      id: 'wood',
      name: 'Wood Floor',
      emoji: '🪵',
      color: '#A16207',
      energyReturn: 0.70,
      classification: 'Medium',
      description: 'Moderate absorption'
    },
    {
      id: 'carpet',
      name: 'Carpet',
      emoji: '🧶',
      color: '#DC2626',
      energyReturn: 0.40,
      classification: 'Soft',
      description: 'High energy absorption'
    }
  ];

  // Enhanced physics calculation with multiple bounces
  const calculateCollisionPhysics = (ball, surface, height) => {
    const impactVelocity = Math.sqrt(2 * GRAVITY * height);
    
    // Base COR from material properties
    let baseCOR = ball.elasticity * surface.energyReturn;
    
    // Adjust for realistic factors
    const velocityFactor = Math.max(0.8, 1 - (impactVelocity - 3) * 0.05);
    baseCOR *= velocityFactor;
    
    const actualCOR = Math.min(Math.max(baseCOR, 0.01), 0.95);
    
    // Calculate multiple bounces using hₙ = h₀ · r² formula
    const bounces = [];
    let currentHeight = height;
    let bounceCount = 0;
    
    while (currentHeight > 0.005 && bounceCount < 15) {
      const reboundHeight = currentHeight * Math.pow(actualCOR, 2);
      bounces.push({
        bounceNumber: bounceCount + 1,
        dropHeight: currentHeight,
        reboundHeight: reboundHeight,
        energyRatio: Math.pow(actualCOR, 2 * (bounceCount + 1))
      });
      currentHeight = reboundHeight;
      bounceCount++;
    }
    
    // Energy calculations
    const initialEnergy = ball.mass * GRAVITY * height;
    const reboundEnergy = ball.mass * GRAVITY * (bounces[0]?.reboundHeight || 0);
    const energyLossPercent = ((initialEnergy - reboundEnergy) / initialEnergy) * 100;
    
    // Determine collision type
    let collisionType = '';
    if (actualCOR > 0.9) collisionType = 'Nearly Elastic';
    else if (actualCOR > 0.7) collisionType = 'Highly Elastic';
    else if (actualCOR > 0.5) collisionType = 'Elastic';
    else if (actualCOR > 0.3) collisionType = 'Partially Inelastic';
    else if (actualCOR > 0.1) collisionType = 'Inelastic';
    else collisionType = 'Perfectly Inelastic';
    
    return {
      coefficientOfRestitution: actualCOR,
      reboundHeight: bounces[0]?.reboundHeight || 0,
      energyLossPercent: energyLossPercent,
      collisionType: collisionType,
      impactVelocity: impactVelocity,
      reboundVelocity: actualCOR * impactVelocity,
      collisionFormula: `h₂ = ${height.toFixed(2)} × ${actualCOR.toFixed(3)}² = ${(bounces[0]?.reboundHeight || 0).toFixed(3)}m`,
      totalBounces: bounceCount,
      bounceSequence: bounces
    };
  };

  // Enhanced animation with realistic bouncing and surface contact
  const performExperiment = () => {
    if (!selectedBall || !selectedSurface || isDropping) return;
    
    setIsDropping(true);
    setShowResults(false);
    setBounceHistory([]);
    setShowParticles(false);
    setTrailPositions([]);
    setIsBallOnSurface(false);
    
    const ball = balls.find(b => b.id === selectedBall);
    const surface = surfaces.find(s => s.id === selectedSurface);
    const physics = calculateCollisionPhysics(ball, surface, dropHeight);
    
    setCurrentExperiment(physics);
    
    const ballElement = ballRef.current;
    const surfaceElement = surfaceRef.current;
    
    if (!ballElement || !surfaceElement) {
      console.error('Missing DOM elements');
      setIsDropping(false);
      return;
    }
    
    // Reset everything
    ballElement.classList.remove('impact', 'complete', 'loading', 'bouncing', 'bouncing-high', 'bouncing-medium', 'bouncing-low', 'celebration', 'on-surface');
    surfaceElement.classList.remove('impact-effect', 'ripple', 'active-impact');
    
    // Start animation with realistic bouncing
    animateRealisticBounce(ball, surface, physics);
  };

  // Realistic bounce animation with proper surface contact
  const animateRealisticBounce = (ball, surface, physics) => {
    const ballElement = ballRef.current;
    const surfaceElement = surfaceRef.current;
    
    if (!ballElement || !surfaceElement) {
      setIsDropping(false);
      return;
    }
    
    const containerHeight = 300;
    const surfaceHeight = 50;
    const ballSize = 50;
    const maxDropHeight = 4;
    
    // Calculate initial drop position
    const surfaceTop = containerHeight - surfaceHeight;
    const dropPixels = (dropHeight / maxDropHeight) * (surfaceTop - ballSize - 20);
    const surfaceContactPosition = surfaceTop - ballSize;
    
    // Reset ball position
    ballElement.classList.remove('bouncing', 'bouncing-high', 'bouncing-medium', 'bouncing-low');
    ballElement.style.transition = 'none';
    ballElement.style.top = '20px';
    ballElement.style.transform = 'translateX(-50%) scale(1)';
    
    // Create shadow element if it doesn't exist
    let shadowElement = document.querySelector('.ball-shadow');
    if (!shadowElement) {
      shadowElement = document.createElement('div');
      shadowElement.className = 'ball-shadow';
      ballElement.parentNode.appendChild(shadowElement);
    }
    
    // Force reflow
    const reflow = ballElement.offsetHeight;
    
    let currentBounce = 0;
    const maxBounces = Math.min(physics.totalBounces, 8);

    // Start initial drop
    animateBounceSequence(0, dropHeight, dropPixels, true);
    
    function animateBounceSequence(bounceIndex, currentHeight, currentPixels, isInitialDrop = false) {
      if (bounceIndex >= maxBounces) {
        // Final settlement on surface
        settleOnSurface(surfaceContactPosition);
        return;
      }
      
      const bounceData = physics.bounceSequence[bounceIndex];
      if (!bounceData) {
        settleOnSurface(surfaceContactPosition);
        return;
      }
      
      // Determine bounce intensity based on rebound height
      const intensity = getBounceIntensity(bounceData.reboundHeight);
      setBounceIntensity(intensity);
      
      const dropTime = Math.sqrt(2 * currentHeight / GRAVITY) * 1000;
      const reboundPixels = (bounceData.reboundHeight / maxDropHeight) * (surfaceTop - ballSize - 20);
      
      if (isInitialDrop) {
        // Initial drop with acceleration
        ballElement.style.transition = `top ${dropTime}ms cubic-bezier(0.55, 0.085, 0.68, 0.53), transform 100ms ease`;
        ballElement.style.top = `${surfaceContactPosition}px`;
        
        // Update shadow during drop
        updateShadow(shadowElement, currentHeight, dropHeight, true);
        
        // Update live measurements during drop
        let dropStartTime = Date.now();
        const dropInterval = setInterval(() => {
          const elapsed = Date.now() - dropStartTime;
          const progress = Math.min(elapsed / dropTime, 1);
          const currentDropHeight = currentHeight * (1 - progress);
          const currentVelocity = Math.sqrt(2 * GRAVITY * (currentHeight - currentDropHeight));
          const currentEnergy = ball.mass * GRAVITY * currentDropHeight;
          
          // Add trail effect
          addTrailPosition(ballElement.offsetTop + ballSize / 2);
          
          // Squash effect just before impact
          if (progress > 0.9) {
            ballElement.style.transform = `translateX(-50%) scale(${1.1}, ${0.9})`;
          }
          
          setLiveMeasurements(prev => ({
            ...prev,
            velocity: currentVelocity,
            height: currentDropHeight,
            energy: currentEnergy,
            bounceCount: currentBounce
          }));
        }, 16);
        
        // When ball hits the surface
        setTimeout(() => {
          clearInterval(dropInterval);
          handleSurfaceImpact(bounceIndex, bounceData, surfaceContactPosition, reboundPixels, intensity);
        }, dropTime);
      } else {
        // Subsequent bounces - drop from current height
        ballElement.style.transition = `top ${dropTime}ms cubic-bezier(0.55, 0.085, 0.68, 0.53), transform 100ms ease`;
        ballElement.style.top = `${surfaceContactPosition}px`;
        
        // Update shadow during drop
        updateShadow(shadowElement, currentHeight, bounceData.dropHeight, false);
        
        // Update measurements during drop
        let dropStartTime = Date.now();
        const dropInterval = setInterval(() => {
          const elapsed = Date.now() - dropStartTime;
          const progress = Math.min(elapsed / dropTime, 1);
          const currentDropHeight = currentHeight * (1 - progress);
          const currentVelocity = Math.sqrt(2 * GRAVITY * currentDropHeight);
          const currentEnergy = ball.mass * GRAVITY * currentDropHeight;
          
          // Add trail effect
          addTrailPosition(ballElement.offsetTop + ballSize / 2);
          
          // Squash effect just before impact
          if (progress > 0.9) {
            ballElement.style.transform = `translateX(-50%) scale(${1.1}, ${0.9})`;
          }
          
          setLiveMeasurements(prev => ({
            ...prev,
            velocity: -currentVelocity,
            height: currentDropHeight,
            energy: currentEnergy,
            bounceCount: currentBounce
          }));
        }, 16);
        
        setTimeout(() => {
          clearInterval(dropInterval);
          handleSurfaceImpact(bounceIndex, bounceData, surfaceContactPosition, reboundPixels, intensity);
        }, dropTime);
      }
    }
    
    function handleSurfaceImpact(bounceIndex, bounceData, contactPosition, reboundPixels, intensity) {
      currentBounce = bounceIndex + 1;
      
      // Record bounce history
      setBounceHistory(prev => [...prev, {
        bounce: currentBounce,
        height: bounceData.reboundHeight,
        energy: Math.pow(physics.coefficientOfRestitution, 2 * currentBounce) * 100
      }]);
      
      // Ball reaches surface - show full contact
      ballElement.style.top = `${contactPosition}px`;
      ballElement.classList.add('on-surface');
      
      // Strong impact effects
      ballElement.classList.add(`impact-${intensity}`);
      surfaceElement.classList.add('active-impact', 'ripple');
      
      // Create particle effect
      createParticles(intensity);
      
      // Update shadow at impact
      shadowElement.style.transform = `translateX(-50%) scale(2)`;
      shadowElement.style.opacity = '0.1';
      
      // Update measurements at impact
      setLiveMeasurements(prev => ({
        ...prev,
        velocity: 0,
        height: 0,
        energy: 0,
        bounceCount: currentBounce
      }));
      
      // Remove impact effects and start bounce up
      setTimeout(() => {
        ballElement.classList.remove(`impact-${intensity}`);
        surfaceElement.classList.remove('active-impact');
        ballElement.classList.remove('on-surface');
        
        if (bounceData.reboundHeight > 0.01) {
          const bounceTime = Math.sqrt(2 * bounceData.reboundHeight / GRAVITY) * 1000;
          const bounceHeight = contactPosition - reboundPixels;
          
          // Apply bouncing animation class
          ballElement.classList.add(`bouncing-${intensity}`);
          shadowElement.classList.add(`bouncing-${intensity}`);
          
          // Bounce up with realistic motion
          ballElement.style.transition = `top ${bounceTime}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 200ms ease`;
          ballElement.style.top = `${bounceHeight}px`;
          ballElement.style.transform = `translateX(-50%) scale(1)`;
          
          // Update shadow during bounce
          shadowElement.style.transform = `translateX(-50%) scale(1)`;
          shadowElement.style.opacity = '0.3';
          
          // Update measurements during bounce up
          let bounceStartTime = Date.now();
          const bounceInterval = setInterval(() => {
            const elapsed = Date.now() - bounceStartTime;
            const progress = Math.min(elapsed / bounceTime, 1);
            const currentBounceHeight = bounceData.reboundHeight * progress;
            const currentVelocity = physics.reboundVelocity * (1 - progress);
            const currentEnergy = ball.mass * GRAVITY * currentBounceHeight;
            
            // Add trail effect
            addTrailPosition(ballElement.offsetTop + ballSize / 2);
            
            // Stretch effect during ascent
            if (progress < 0.3) {
              ballElement.style.transform = `translateX(-50%) scale(${0.9}, ${1.1})`;
            } else {
              ballElement.style.transform = `translateX(-50%) scale(1)`;
            }
            
            setLiveMeasurements(prev => ({
              ...prev,
              velocity: currentVelocity,
              height: currentBounceHeight,
              energy: currentEnergy,
              bounceCount: currentBounce
            }));
          }, 16);
          
          // Prepare for next bounce
          setTimeout(() => {
            clearInterval(bounceInterval);
            ballElement.classList.remove(`bouncing-${intensity}`);
            shadowElement.classList.remove(`bouncing-${intensity}`);
            
            // Check if we should continue bouncing
            const nextBounceIndex = bounceIndex + 1;
            const nextBounceData = physics.bounceSequence[nextBounceIndex];
            
            if (nextBounceData && nextBounceData.reboundHeight > 0.01) {
              // Continue with next bounce
              setTimeout(() => {
                animateBounceSequence(nextBounceIndex, bounceData.reboundHeight, bounceHeight, false);
              }, 50);
            } else {
              // Final settlement
              setTimeout(() => {
                settleOnSurface(contactPosition);
              }, 100);
            }
          }, bounceTime);
        } else {
          // No significant bounce - settle immediately
          setTimeout(() => {
            settleOnSurface(contactPosition);
          }, 200);
        }
      }, 120); // Contact duration
    }
    
    function settleOnSurface(contactPosition) {
      // Final settlement on surface
      ballElement.style.transition = `top 300ms ease-out, transform 400ms ease`;
      ballElement.style.top = `${contactPosition}px`;
      ballElement.classList.add('on-surface', 'settled');
      
      // Final shadow
      shadowElement.style.transform = `translateX(-50%) scale(1.5)`;
      shadowElement.style.opacity = '0.4';
      
      // Final squash and settle
      setTimeout(() => {
        ballElement.style.transform = `translateX(-50%) scale(1.05, 0.95)`;
        
        setTimeout(() => {
          ballElement.style.transform = `translateX(-50%) scale(1)`;
          setIsBallOnSurface(true);
          finishExperiment(ball, surface, physics);
        }, 200);
      }, 300);
    }
    
    // Helper function to determine bounce intensity
    function getBounceIntensity(reboundHeight) {
      if (reboundHeight > dropHeight * 0.5) return 'high';
      if (reboundHeight > dropHeight * 0.2) return 'medium';
      return 'low';
    }
    
    // Helper function to update shadow
    function updateShadow(shadowElement, currentHeight, maxHeight, isInitial) {
      const scale = 1 + (currentHeight / maxHeight) * 0.8;
      const opacity = 0.2 + (currentHeight / maxHeight) * 0.3;
      shadowElement.style.transform = `translateX(-50%) scale(${scale})`;
      shadowElement.style.opacity = opacity.toString();
    }
    
    // Helper function to create particle effects
    function createParticles(intensity) {
      setShowParticles(true);
      setTimeout(() => {
        setShowParticles(false);
      }, 600);
    }
    
    // Helper function to add trail positions
    function addTrailPosition(top) {
      const newTrail = {
        id: Date.now() + Math.random(),
        top: top,
        left: '50%'
      };
      setTrailPositions(prev => [...prev.slice(-8), newTrail]);
      
      // Auto-remove trail after animation
      setTimeout(() => {
        setTrailPositions(prev => prev.filter(trail => trail.id !== newTrail.id));
      }, 800);
    }
  };

  const finishExperiment = (ball, surface, physics) => {
    setIsDropping(false);
    setShowResults(true);
    recordExperiment(ball, surface, physics);
    
    const ballElement = ballRef.current;
    if (ballElement) {
      ballElement.classList.add('complete');
    }
    
    // Remove shadow
    const shadowElement = document.querySelector('.ball-shadow');
    if (shadowElement) {
      shadowElement.remove();
    }
    
    // Final live measurements
    setLiveMeasurements({
      velocity: 0,
      height: 0,
      energy: 0,
      cor: physics.coefficientOfRestitution,
      bounceCount: physics.totalBounces
    });
  };

  const recordExperiment = (ball, surface, physics) => {
    const experiment = {
      ball: ball.name,
      surface: surface.name,
      dropHeight: dropHeight,
      reboundHeight: physics.reboundHeight,
      coefficientOfRestitution: physics.coefficientOfRestitution,
      energyLost: physics.energyLossPercent,
      collisionType: physics.collisionType,
      ballType: ball.classification,
      collisionFormula: physics.collisionFormula,
      totalBounces: physics.totalBounces,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setExperiments(prev => [...prev, experiment]);
    setCurrentExperiment(experiment);
  };

  const resetExperiment = () => {
    setIsDropping(false);
    setShowResults(false);
    setLiveMeasurements({
      velocity: 0,
      height: 0,
      energy: 0,
      cor: 0,
      bounceCount: 0
    });
    setBounceHistory([]);
    setBounceIntensity('medium');
    setShowParticles(false);
    setTrailPositions([]);
    setIsBallOnSurface(false);
    
    const ballElement = ballRef.current;
    if (ballElement) {
      ballElement.classList.remove(
        'impact', 'complete', 'loading', 
        'bouncing', 'bouncing-high', 'bouncing-medium', 'bouncing-low',
        'celebration', 'impact-strong', 'impact-medium', 'impact-weak',
        'on-surface', 'settled'
      );
      ballElement.style.transition = 'none';
      ballElement.style.top = '20px';
      ballElement.style.transform = 'translateX(-50%) scale(1)';
      const reflow = ballElement.offsetHeight;
    }
    
    if (surfaceRef.current) {
      surfaceRef.current.classList.remove('impact-effect', 'ripple', 'active-impact');
    }
    
    // Remove shadow and particles
    const shadowElement = document.querySelector('.ball-shadow');
    if (shadowElement) {
      shadowElement.remove();
    }
  };

  const completeQuest = () => {
    if (experiments.length >= 3) {
      onComplete();
    } else {
      alert('Please complete at least 3 experiments to unlock the Collision Calculator!');
    }
  };

  const getCORColor = (cor) => {
    if (cor > 0.8) return '#10B981';
    if (cor > 0.6) return '#22C55E';
    if (cor > 0.4) return '#F59E0B';
    if (cor > 0.2) return '#EF4444';
    return '#6B7280';
  };

  return (
    <div className="bounce-or-break">
      {/* Header */}
      <div className="lab-header">
        <div className="lab-title">
          <button className="back-button" onClick={() => navigate('menu')}>
            ← Back to Lab
          </button>
          <h1>🧪 Bounce or Break</h1>
          <p className="lab-subtitle">Test and classify materials based on their bounciness</p>
        </div>
        
        <div className="lab-context">
          <div className="context-card">
            <h3>Lab Mission</h3>
            <p>The valley's lab needs new data on how objects collide. Test various balls on different surfaces and classify the collisions as elastic or inelastic.</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="lab-tabs">
        <button 
          className={`tab-button ${activeTab === 'experiment' ? 'active' : ''}`}
          onClick={() => setActiveTab('experiment')}
        >
          🎯 Experiment
        </button>
        <button 
          className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          📊 Data Log
        </button>
        <button 
          className={`tab-button ${activeTab === 'theory' ? 'active' : ''}`}
          onClick={() => setActiveTab('theory')}
        >
          📚 Physics Guide
        </button>
      </div>

      {/* Main Content */}
      <div className="lab-content">
        {activeTab === 'experiment' && (
          <div className="experiment-interface">
            {/* Materials Selection */}
            <div className="materials-section">
              <div className="materials-column">
                <h3>🎾 Test Objects</h3>
                <div className="materials-grid">
                  {balls.map(ball => (
                    <div
                      key={ball.id}
                      className={`material-card ${selectedBall === ball.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBall(ball.id)}
                    >
                      <div className="material-icon" style={{ backgroundColor: ball.color }}>
                        {ball.emoji}
                      </div>
                      <div className="material-info">
                        <div className="material-name">{ball.name}</div>
                        <div className="material-class">{ball.classification}</div>
                        <div className="material-desc">{ball.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="materials-column">
                <h3>🏗️ Test Surfaces</h3>
                <div className="materials-grid">
                  {surfaces.map(surface => (
                    <div
                      key={surface.id}
                      className={`material-card ${selectedSurface === surface.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSurface(surface.id)}
                    >
                      <div className="material-icon" style={{ backgroundColor: surface.color }}>
                        {surface.emoji}
                      </div>
                      <div className="material-info">
                        <div className="material-name">{surface.name}</div>
                        <div className="material-class">{surface.classification}</div>
                        <div className="material-desc">{surface.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Experiment Controls */}
            <div className="experiment-controls">
              <div className="control-group">
                <label>Drop Height: {dropHeight.toFixed(1)} meters</label>
                <input
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.1"
                  value={dropHeight}
                  onChange={(e) => setDropHeight(parseFloat(e.target.value))}
                  disabled={isDropping}
                />
                <div className="height-info">
                  <span>Impact Velocity: {Math.sqrt(2 * GRAVITY * dropHeight).toFixed(1)} m/s</span>
                </div>
              </div>

              <div className="control-buttons">
                <button
                  className="experiment-button primary"
                  onClick={performExperiment}
                  disabled={!selectedBall || !selectedSurface || isDropping}
                >
                  {isDropping ? '🌀 Testing...' : '🎯 Perform Experiment'}
                </button>
                <button
                  className="experiment-button secondary"
                  onClick={resetExperiment}
                  disabled={isDropping}
                >
                  🔄 Reset
                </button>
              </div>
            </div>

            {/* Simulation Area */}
            <div className="simulation-area">
              <div className="drop-chamber">
                <div className="height-scale">
                  <span>4m</span>
                  <span>3m</span>
                  <span>2m</span>
                  <span>1m</span>
                  <div className="scale-line"></div>
                </div>

                {/* Enhanced Live Measurements */}
                <div className="live-measurements">
                  <div className="measurement-card">
                    <div className="measurement-label">Current Height</div>
                    <div className="measurement-value">
                      {liveMeasurements.height.toFixed(2)} m
                    </div>
                  </div>
                  <div className="measurement-card">
                    <div className="measurement-label">Velocity</div>
                    <div className="measurement-value">
                      {Math.abs(liveMeasurements.velocity).toFixed(2)} m/s
                      {liveMeasurements.velocity > 0 ? ' ↑' : liveMeasurements.velocity < 0 ? ' ↓' : ''}
                    </div>
                  </div>
                  <div className="measurement-card">
                    <div className="measurement-label">Energy</div>
                    <div className="measurement-value">
                      {liveMeasurements.energy.toFixed(2)} J
                    </div>
                  </div>
                  <div className="measurement-card bounce-count">
                    <div className="measurement-label">Bounce Count</div>
                    <div className="measurement-value">
                      {liveMeasurements.bounceCount}
                    </div>
                  </div>
                  {liveMeasurements.cor > 0 && (
                    <div className="measurement-card">
                      <div className="measurement-label">COR</div>
                      <div className="measurement-value" style={{ color: getCORColor(liveMeasurements.cor) }}>
                        {liveMeasurements.cor.toFixed(3)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Animation Effects */}
                {showParticles && (
                  <div className="impact-particles">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="particle"
                        style={{
                          '--tx': `${(Math.random() - 0.5) * 100}px`,
                          '--ty': `${-Math.random() * 50}px`,
                          animation: `particleFly 0.6s ease-out ${i * 0.05}s forwards`,
                          left: `${50 + (Math.random() - 0.5) * 40}%`,
                          bottom: '0px'
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Bounce Trail */}
                <div className="bounce-trail">
                  {trailPositions.map((trail) => (
                    <div
                      key={trail.id}
                      className="trail-dot"
                      style={{
                        top: `${trail.top}px`,
                        left: trail.left,
                        backgroundColor: selectedBall ? balls.find(b => b.id === selectedBall)?.color : '#6B7280'
                      }}
                    />
                  ))}
                </div>

                {/* Ball element */}
                <div
                  ref={ballRef}
                  className={`test-ball ${isDropping ? 'loading' : ''} ${showResults ? 'complete' : ''} ${isBallOnSurface ? 'on-surface settled' : ''}`}
                  style={{
                    '--ball-color': selectedBall ? balls.find(b => b.id === selectedBall)?.color : '#6B7280',
                    top: '20px'
                  }}
                >
                  {selectedBall && balls.find(b => b.id === selectedBall)?.emoji}
                </div>

                <div
                  ref={surfaceRef}
                  className={`test-surface ${isDropping ? 'active' : ''}`}
                  style={{
                    backgroundColor: selectedSurface 
                      ? surfaces.find(s => s.id === selectedSurface)?.color 
                      : '#6B7280'
                  }}
                >
                  <div className="surface-label">
                    {selectedSurface && surfaces.find(s => s.id === selectedSurface)?.name}
                    {isBallOnSurface && <span className="surface-contact"> • CONTACT</span>}
                  </div>
                </div>
              </div>

              {/* Results Display */}
              {showResults && currentExperiment && (
                <div className="results-panel">
                  <h3>📊 Experiment Results</h3>
                  
                  <div className={`collision-classification ${currentExperiment.collisionType.toLowerCase().replace(/ /g, '-')}`}>
                    <div className="classification-icon">
                      {currentExperiment.coefficientOfRestitution > 0.5 ? '⚡' : '💥'}
                    </div>
                    <div className="classification-text">
                      <strong>{currentExperiment.collisionType} Collision</strong>
                      <span>Coefficient of Restitution: {currentExperiment.coefficientOfRestitution.toFixed(3)}</span>
                      <span>Total Bounces: {currentExperiment.totalBounces}</span>
                    </div>
                  </div>

                  {/* Bounce Sequence Display */}
                  {bounceHistory.length > 0 && (
                    <div className="bounce-sequence">
                      <h4>Bounce Sequence Analysis</h4>
                      <div className="bounce-history">
                        {bounceHistory.slice(0, 8).map((bounce, index) => (
                          <div key={index} className="bounce-item">
                            <div className="bounce-number">Bounce #{bounce.bounce}</div>
                            <div className="bounce-height">Height: {bounce.height.toFixed(3)}m</div>
                            <div className="bounce-energy">Energy: {bounce.energy.toFixed(1)}%</div>
                            <div className="bounce-formula">
                              h{String.fromCharCode(8320 + bounce.bounce)} = {dropHeight.toFixed(2)} × {currentExperiment.coefficientOfRestitution.toFixed(3)}
                              <sup>{2 * bounce.bounce}</sup> = {bounce.height.toFixed(3)}m
                            </div>
                          </div>
                        ))}
                        {bounceHistory.length > 8 && (
                          <div className="bounce-more">
                            + {bounceHistory.length - 8} more bounces...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Formula Display */}
                  <div className="formula-display">
                    <h4>Collision Formula Applied</h4>
                    <div className="formula-card">
                      <div className="formula-title">hₙ = h₀ · r²</div>
                      <div className="formula-explanation">
                        Where:
                        <ul>
                          <li>h₀ = Initial height ({dropHeight.toFixed(2)}m)</li>
                          <li>r = Coefficient of restitution ({currentExperiment.coefficientOfRestitution.toFixed(3)})</li>
                          <li>hₙ = Rebound height after n bounces</li>
                          <li>Total bounces until rest: {currentExperiment.totalBounces}</li>
                        </ul>
                      </div>
                      <div className="formula-calculation">
                        {currentExperiment.collisionFormula}
                      </div>
                    </div>
                  </div>

                  <div className="results-grid">
                    <div className="result-card">
                      <div className="result-label">Drop Height</div>
                      <div className="result-value">{currentExperiment.dropHeight.toFixed(2)} m</div>
                    </div>
                    <div className="result-card">
                      <div className="result-label">Rebound Height</div>
                      <div className="result-value">{currentExperiment.reboundHeight.toFixed(2)} m</div>
                    </div>
                    <div className="result-card">
                      <div className="result-label">Energy Lost</div>
                      <div className="result-value" style={{ color: getCORColor(currentExperiment.coefficientOfRestitution) }}>
                        {currentExperiment.energyLost.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="energy-conservation">
                    <h4>Energy Conservation Analysis</h4>
                    <div className="energy-visualization">
                      <div className="energy-bar initial">
                        <div className="bar-label">Initial Potential Energy: 100%</div>
                        <div className="bar-fill full"></div>
                      </div>
                      <div className="energy-bar final">
                        <div className="bar-label">Rebound Potential Energy: {(100 - currentExperiment.energyLost).toFixed(1)}%</div>
                        <div 
                          className="bar-fill"
                          style={{ width: `${100 - currentExperiment.energyLost}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="physics-explanation">
                      <strong>Physics Insight:</strong> The coefficient of restitution squared (e²) represents the fraction of energy retained: {(Math.pow(currentExperiment.coefficientOfRestitution, 2) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="data-log">
            <h3>📈 Experiment Data Log</h3>
            {experiments.length === 0 ? (
              <div className="empty-state">
                <p>No experiments recorded yet.</p>
                <p>Perform some experiments to see your data here!</p>
              </div>
            ) : (
              <div className="data-table">
                <div className="table-header">
                  <span>Ball</span>
                  <span>Surface</span>
                  <span>Drop (m)</span>
                  <span>Rebound (m)</span>
                  <span>Coefficient</span>
                  <span>Type</span>
                  <span>Bounces</span>
                  <span>Formula</span>
                </div>
                {experiments.slice().reverse().map((exp, index) => (
                  <div key={index} className="table-row">
                    <span>{exp.ball}</span>
                    <span>{exp.surface}</span>
                    <span>{exp.dropHeight}</span>
                    <span>{exp.reboundHeight.toFixed(2)}</span>
                    <span style={{ color: getCORColor(exp.coefficientOfRestitution) }}>
                      {exp.coefficientOfRestitution.toFixed(2)}
                    </span>
                    <span className={`collision-type ${exp.collisionType.toLowerCase().replace(/ /g, '-')}`}>
                      {exp.collisionType}
                    </span>
                    <span>{exp.totalBounces}</span>
                    <span className="formula-cell" title={exp.collisionFormula}>
                      h₂ = h₀·r²
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'theory' && (
          <div className="theory-guide">
            <div className="guide-section">
              <h3>🎯 Learning Objectives</h3>
              <ul>
                <li>Understand elastic and inelastic collisions</li>
                <li>Learn about energy conservation in collisions</li>
                <li>Classify materials based on bounce characteristics</li>
                <li>Calculate coefficient of restitution</li>
                <li>Apply the collision formula hₙ = h₀ · r²</li>
              </ul>
            </div>

            <div className="guide-section">
              <h3>📊 Collision Classification</h3>
              <div className="classification-guide">
                <div className="type-item elastic">
                  <strong>Elastic Collisions (COR &gt; 0.7)</strong>
                  <p>Minimal energy loss, objects bounce well. Kinetic energy is nearly conserved.</p>
                </div>
                <div className="type-item inelastic">
                  <strong>Inelastic Collisions (COR &lt; 0.3)</strong>
                  <p>Significant energy loss, poor bounce. Energy converted to heat/sound.</p>
                </div>
                <div className="type-item partially-elastic">
                  <strong>Partially Elastic (0.3 ≤ COR ≤ 0.7)</strong>
                  <p>Moderate energy loss. Some energy conserved, some dissipated.</p>
                </div>
              </div>
            </div>

            <div className="guide-section">
              <h3>⚡ Physics Formulas</h3>
              <div className="formulas">
                <div className="formula">
                  <strong>Coefficient of Restitution (e):</strong>
                  <code>e = √(h₂/h₁) = v₂/v₁</code>
                  <p>Where h₁ is drop height, h₂ is rebound height</p>
                </div>
                <div className="formula">
                  <strong>Collision Formula:</strong>
                  <code>hₙ = h₀ · r²</code>
                  <p>Where h₀ is initial height, r is coefficient of restitution, hₙ is rebound height after n bounces</p>
                </div>
                <div className="formula">
                  <strong>Impact Velocity:</strong>
                  <code>v = √(2gh)</code>
                  <p>Where g is gravity (9.81 m/s²), h is height</p>
                </div>
                <div className="formula">
                  <strong>Energy Lost:</strong>
                  <code>Energy Loss = (1 - e²) × 100%</code>
                  <p>Percentage of initial energy converted to other forms</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assessment & Completion */}
      <div className="lab-assessment">
        <div className="assessment-progress">
          <h3>Lab Progress</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${Math.min((experiments.length / 3) * 100, 100)}%` }}
            ></div>
          </div>
          <p>{experiments.length} of 3 experiments completed</p>
          
          {experiments.length > 0 && (
            <div className="progress-tip">
              💡 <strong>Research Insight:</strong> Real-world collisions are never perfectly elastic due to energy dissipation as heat, sound, and permanent deformation.
            </div>
          )}
        </div>

        <button 
          className="complete-lab-button"
          onClick={completeQuest}
          disabled={experiments.length < 3}
        >
          {experiments.length >= 3 ? '⚙️ Unlock Collision Calculator' : '🔒 Complete 3 Experiments'}
        </button>

        <div className="reward-info">
          <p>Complete 3 experiments to unlock the advanced Collision Calculator tool!</p>
        </div>
      </div>
    </div>
  );
};

export default BounceOrBreak;