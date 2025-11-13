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

  // Calculate physics based on ball and surface properties
  const calculateCollisionPhysics = (ball, surface, height) => {
    const impactVelocity = Math.sqrt(2 * GRAVITY * height);
    
    // Base COR from material properties
    let baseCOR = ball.elasticity * surface.energyReturn;
    
    // Adjust for realistic factors
    const velocityFactor = Math.max(0.8, 1 - (impactVelocity - 3) * 0.05);
    baseCOR *= velocityFactor;
    
    const actualCOR = Math.min(Math.max(baseCOR, 0.01), 0.95);
    const reboundHeight = height * Math.pow(actualCOR, 2);
    
    // Energy calculations
    const initialEnergy = ball.mass * GRAVITY * height;
    const reboundEnergy = ball.mass * GRAVITY * reboundHeight;
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
      reboundHeight: reboundHeight,
      energyLossPercent: energyLossPercent,
      collisionType: collisionType,
      impactVelocity: impactVelocity,
      reboundVelocity: actualCOR * impactVelocity
    };
  };

  // FIXED: Improved animation function with proper positioning
  const performExperiment = () => {
    if (!selectedBall || !selectedSurface || isDropping) return;
    
    console.log('Starting experiment with:', { selectedBall, selectedSurface, dropHeight });
    
    setIsDropping(true);
    setShowResults(false);
    
    const ball = balls.find(b => b.id === selectedBall);
    const surface = surfaces.find(s => s.id === selectedSurface);
    const physics = calculateCollisionPhysics(ball, surface, dropHeight);
    
    const ballElement = ballRef.current;
    const surfaceElement = surfaceRef.current;
    
    console.log('DOM elements:', { ballElement, surfaceElement });
    
    if (!ballElement || !surfaceElement) {
      console.error('Missing DOM elements');
      setIsDropping(false);
      return;
    }
    
    // Reset everything
    ballElement.classList.remove('impact', 'complete', 'loading');
    surfaceElement.classList.remove('impact-effect');
    
    // FIXED: Force reflow by assigning to a variable instead of standalone expression
    const reflow = ballElement.offsetHeight;
    
    // Start animation
    requestAnimationFrame(() => {
      animateBallDrop(ball, surface, physics);
    });
  };

  // FIXED: Completely rewritten animation function
  const animateBallDrop = (ball, surface, physics) => {
    const ballElement = ballRef.current;
    const surfaceElement = surfaceRef.current;
    
    if (!ballElement || !surfaceElement) {
      setIsDropping(false);
      return;
    }
    
    const containerHeight = 300; // Match CSS height
    const surfaceHeight = 50; // Match CSS surface height
    const ballSize = 50; // Match CSS ball size
    
    // Calculate drop distance in pixels
    const maxDropHeight = 4; // Maximum drop height in meters
    const dropPixels = (dropHeight / maxDropHeight) * (containerHeight - surfaceHeight - ballSize - 20);
    
    console.log('Animation parameters:', { 
      dropHeight, 
      dropPixels, 
      containerHeight, 
      maxDropHeight 
    });
    
    // Add loading state
    ballElement.classList.add('loading');
    
    // Calculate timing based on physics (convert to milliseconds)
    const dropTime = Math.sqrt(2 * dropHeight / GRAVITY) * 1000;
    
    // FIXED: Use CSS top property instead of transform for better control
    ballElement.style.transition = `top ${dropTime}ms cubic-bezier(0.55, 0.085, 0.68, 0.53)`;
    ballElement.style.top = `${dropPixels}px`;
    
    // When ball hits the surface
    setTimeout(() => {
      console.log('Ball hit surface - starting bounce');
      
      // Impact effects
      ballElement.classList.remove('loading');
      ballElement.classList.add('impact');
      surfaceElement.classList.add('impact-effect');
      
      // Calculate bounce parameters
      const reboundHeight = physics.reboundHeight;
      const bouncePixels = (reboundHeight / maxDropHeight) * (containerHeight - surfaceHeight - ballSize - 20);
      const bounceTime = Math.sqrt(2 * reboundHeight / GRAVITY) * 1000;
      
      console.log('Bounce parameters:', { reboundHeight, bouncePixels, bounceTime });
      
      // Remove impact effects and start bounce
      setTimeout(() => {
        ballElement.classList.remove('impact');
        surfaceElement.classList.remove('impact-effect');
        
        if (bouncePixels > 2) { // Only bounce if significant height
          // First bounce up
          ballElement.style.transition = `top ${bounceTime}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
          ballElement.style.top = `${dropPixels - bouncePixels}px`;
          
          // Fall back down
          setTimeout(() => {
            ballElement.style.transition = `top ${bounceTime * 0.8}ms cubic-bezier(0.55, 0.085, 0.68, 0.53)`;
            ballElement.style.top = `${dropPixels}px`;
            
            // Second bounce (smaller)
            setTimeout(() => {
              const secondBounceHeight = reboundHeight * physics.coefficientOfRestitution;
              const secondBouncePixels = (secondBounceHeight / maxDropHeight) * (containerHeight - surfaceHeight - ballSize - 20);
              
              if (secondBouncePixels > 1) {
                const secondBounceTime = Math.sqrt(2 * secondBounceHeight / GRAVITY) * 800;
                
                // Second bounce up
                ballElement.style.transition = `top ${secondBounceTime}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
                ballElement.style.top = `${dropPixels - secondBouncePixels}px`;
                
                // Final fall
                setTimeout(() => {
                  ballElement.style.transition = `top ${secondBounceTime * 0.6}ms cubic-bezier(0.55, 0.085, 0.68, 0.53)`;
                  ballElement.style.top = `${dropPixels}px`;
                  
                  // Animation complete
                  setTimeout(() => {
                    finishExperiment(ball, surface, physics);
                  }, secondBounceTime * 0.6);
                }, secondBounceTime);
              } else {
                finishExperiment(ball, surface, physics);
              }
            }, bounceTime * 0.8);
          }, bounceTime);
        } else {
          // No significant bounce - just complete
          setTimeout(() => {
            finishExperiment(ball, surface, physics);
          }, 300);
        }
      }, 150); // Impact effect duration
    }, dropTime);
  };

  const finishExperiment = (ball, surface, physics) => {
    setIsDropping(false);
    setShowResults(true);
    recordExperiment(ball, surface, physics);
    
    const ballElement = ballRef.current;
    if (ballElement) {
      ballElement.classList.add('complete');
    }
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
      timestamp: new Date().toLocaleTimeString()
    };
    
    setExperiments(prev => [...prev, experiment]);
    setCurrentExperiment(experiment);
  };

  // FIXED: Reset function
  const resetExperiment = () => {
    setIsDropping(false);
    setShowResults(false);
    
    const ballElement = ballRef.current;
    if (ballElement) {
      ballElement.classList.remove('impact', 'complete', 'loading');
      ballElement.style.transition = 'none';
      ballElement.style.top = '20px'; // Reset to top position
      
      // FIXED: Force reflow by assigning to a variable
      const reflow = ballElement.offsetHeight;
    }
    
    if (surfaceRef.current) {
      surfaceRef.current.classList.remove('impact-effect');
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

                {isDropping && (
                  <div className="animation-stats">
                    <div>🏃‍♂️ Velocity: {Math.sqrt(2 * GRAVITY * dropHeight).toFixed(1)} m/s</div>
                    <div>⚡ Energy: {(selectedBall ? balls.find(b => b.id === selectedBall)?.mass * GRAVITY * dropHeight : 0).toFixed(2)} J</div>
                  </div>
                )}

                {/* FIXED: Ball element with proper initial positioning */}
                <div
                  ref={ballRef}
                  className={`test-ball ${isDropping ? 'loading' : ''} ${showResults ? 'complete' : ''}`}
                  style={{
                    '--ball-color': selectedBall ? balls.find(b => b.id === selectedBall)?.color : '#6B7280',
                    top: '20px' // Initial position at top
                  }}
                >
                  {selectedBall && balls.find(b => b.id === selectedBall)?.emoji}
                </div>

                <div
                  ref={surfaceRef}
                  className="test-surface"
                  style={{
                    backgroundColor: selectedSurface 
                      ? surfaces.find(s => s.id === selectedSurface)?.color 
                      : '#6B7280'
                  }}
                >
                  <div className="surface-label">
                    {selectedSurface && surfaces.find(s => s.id === selectedSurface)?.name}
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