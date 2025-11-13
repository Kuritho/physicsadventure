// ============================================
// FILE: src/worlds/World1/OperationCushionImpact.js
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import './OperationCushionImpact.css';

// Easing functions for realistic motion
const easeInQuad = (t) => {
  return t * t;
};

const easeOutQuad = (t) => {
  return t * (2 - t);
};

const easeInOutQuad = (t) => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

const OperationCushionImpact = ({ onComplete, navigate }) => {
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [dropHeight, setDropHeight] = useState(2); // meters
  const [isDropping, setIsDropping] = useState(false);
  const [eggSurvived, setEggSurvived] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [experiments, setExperiments] = useState([]);
  const [currentExperiment, setCurrentExperiment] = useState(null);
  const [impactForce, setImpactForce] = useState(0);
  const [impactTime, setImpactTime] = useState(0);
  const [impulse, setImpulse] = useState(0);
  const [showTheory, setShowTheory] = useState(true);
  const [armorUnlocked, setArmorUnlocked] = useState(false);

  const eggRef = useRef(null);
  const platformRef = useRef(null);
  const animationRef = useRef(null);

  // Physics Constants
  const EGG_MASS = 0.06; // kg (60g egg)
  const GRAVITY = 9.81; // m/s²
  const SURVIVAL_FORCE_THRESHOLD = 50; // Newtons (max safe force)

  // Enhanced Material Properties with more realistic physics
  const materials = [
    {
      id: 'concrete',
      name: 'Concrete',
      emoji: '🏗️',
      color: '#6B7280',
      stiffness: 0.98,
      damping: 0.02,
      impactTime: 0.005,
      survivalRate: 0.05,
      description: 'Very hard - high force, short time',
      sound: '💥'
    },
    {
      id: 'wood',
      name: 'Wood',
      emoji: '🪵',
      color: '#A16207',
      stiffness: 0.85,
      damping: 0.15,
      impactTime: 0.015,
      survivalRate: 0.2,
      description: 'Hard - medium force',
      sound: '🪵'
    },
    {
      id: 'carpet',
      name: 'Carpet',
      emoji: '🧶',
      color: '#DC2626',
      stiffness: 0.6,
      damping: 0.4,
      impactTime: 0.03,
      survivalRate: 0.5,
      description: 'Soft - longer impact time',
      sound: '🔇'
    },
    {
      id: 'foam',
      name: 'Memory Foam',
      emoji: '🧽',
      color: '#7C3AED',
      stiffness: 0.3,
      damping: 0.7,
      impactTime: 0.08,
      survivalRate: 0.8,
      description: 'Very soft - best protection',
      sound: '💨'
    },
    {
      id: 'bubblewrap',
      name: 'Bubble Wrap',
      emoji: '🫧',
      color: '#06B6D4',
      stiffness: 0.15,
      damping: 0.85,
      impactTime: 0.12,
      survivalRate: 0.95,
      description: 'Excellent - longest impact time',
      sound: '🫧'
    },
    {
      id: 'custom',
      name: 'Your Design',
      emoji: '✨',
      color: '#10B981',
      stiffness: 0.5,
      damping: 0.5,
      impactTime: 0.05,
      survivalRate: 0.7,
      description: 'Custom material - experiment!',
      sound: '⚡'
    }
  ];

  // Enhanced physics calculation with more realistic model
  const calculateImpactPhysics = (material, height) => {
    // Calculate impact velocity: v = √(2gh)
    const impactVelocity = Math.sqrt(2 * GRAVITY * height);
    
    // Calculate momentum change: Δp = m * v
    const momentumChange = EGG_MASS * impactVelocity;
    
    // Enhanced force calculation with damping and stiffness
    const effectiveImpactTime = material.impactTime * (1 + material.damping);
    const peakForce = (momentumChange / effectiveImpactTime) * (1 + material.stiffness);
    const averageForce = peakForce * (1 - material.damping);
    
    // Impulse: J = F_avg * Δt = Δp
    const calculatedImpulse = averageForce * effectiveImpactTime;
    
    // Enhanced survival calculation
    const forceRatio = averageForce / SURVIVAL_FORCE_THRESHOLD;
    const survivalChance = Math.max(0, material.survivalRate * (1 - forceRatio));
    const survived = Math.random() < survivalChance;
    
    return {
      impactVelocity: impactVelocity,
      momentumChange: momentumChange,
      impactTime: effectiveImpactTime,
      averageForce: averageForce,
      peakForce: peakForce,
      impulse: calculatedImpulse,
      survived: survived,
      survivalChance: Math.max(0, Math.min(1, survivalChance))
    };
  };

  const performExperiment = () => {
    if (!selectedMaterial || isDropping) return;
    
    setIsDropping(true);
    setEggSurvived(null);
    setShowResults(false);
    
    const material = materials.find(m => m.id === selectedMaterial);
    const physics = calculateImpactPhysics(material, dropHeight);
    
    setImpactForce(physics.averageForce);
    setImpactTime(physics.impactTime);
    setImpulse(physics.impulse);
    
    // Enhanced animation with realistic falling speed
    const egg = eggRef.current;
    const platform = platformRef.current;
    const dropDistance = 200; // pixels - total fall distance
    
    if (egg && platform) {
      // Reset egg position and styles
      egg.style.transform = 'translateY(0px) rotate(0deg)';
      egg.style.opacity = '1';
      egg.classList.remove('survived', 'broken');
      
      let startTime = null;
      
      // Realistic falling duration based on physics
      // Base duration gives good visibility while maintaining realistic proportions
      const baseDuration = 1500; // ms for reference height
      const duration = baseDuration * Math.sqrt(dropHeight / 2.5);
      
      const animateDrop = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress < 1) {
          // Realistic falling motion with proper acceleration
          // Use quadratic easing for gravity-like acceleration
          const fallProgress = progress < 0.9 ? 
            // Accelerating fall (0 to 90% of animation)
            easeInQuad(progress * (1/0.9)) * 0.9 :
            // Gentle approach to impact (last 10%)
            0.9 + easeOutQuad((progress - 0.9) * 10) * 0.1;
          
          const translateY = fallProgress * dropDistance;
          
          // Gentle rotation that increases with speed
          const rotation = progress * 12 * Math.sin(progress * Math.PI * 2);
          
          egg.style.transform = `translateY(${translateY}px) rotate(${rotation}deg)`;
          animationRef.current = requestAnimationFrame(animateDrop);
        } else {
          // Impact phase
          egg.style.transform = `translateY(${dropDistance}px) rotate(0deg)`;
          
          // Enhanced impact effect based on material
          platform.classList.add('impact-effect');
          egg.classList.add('impact-effect');
          platform.classList.add(`impact-${material.id}`);
          
          // Show impact results after a brief pause
          setTimeout(() => {
            setIsDropping(false);
            setEggSurvived(physics.survived);
            setShowResults(true);
            
            // Record experiment
            const experiment = {
              material: material.name,
              materialId: material.id,
              height: dropHeight,
              force: physics.averageForce,
              peakForce: physics.peakForce,
              time: physics.impactTime,
              impulse: physics.impulse,
              survived: physics.survived,
              survivalChance: physics.survivalChance,
              impactVelocity: physics.impactVelocity,
              momentumChange: physics.momentumChange,
              timestamp: new Date().toLocaleTimeString()
            };
            
            setExperiments(prev => [...prev, experiment]);
            setCurrentExperiment(experiment);
            
            // Check for armor unlock condition
            if (experiments.length >= 1 && physics.survived && physics.averageForce < 30) {
              setArmorUnlocked(true);
            }
            
            // Reset platform animations
            platform.classList.remove('impact-effect', `impact-${material.id}`);
            egg.classList.remove('impact-effect');
            
            // Apply final egg state
            if (physics.survived) {
              egg.classList.add('survived');
              // Bounce effect for survived eggs
              egg.style.animation = 'eggBounce 0.5s ease';
            } else {
              egg.classList.add('broken');
            }
          }, 400); // Shorter pause for better responsiveness
        }
      };
      
      animationRef.current = requestAnimationFrame(animateDrop);
    }
  };

  const resetExperiment = () => {
    setIsDropping(false);
    setEggSurvived(null);
    setShowResults(false);
    
    if (eggRef.current) {
      eggRef.current.classList.remove('survived', 'broken');
      eggRef.current.style.transform = 'translateY(0px) rotate(0deg)';
      eggRef.current.style.opacity = '1';
      eggRef.current.style.animation = '';
    }
    
    if (platformRef.current) {
      platformRef.current.classList.remove('impact-effect', 'impact-concrete', 'impact-wood', 'impact-carpet', 'impact-foam', 'impact-bubblewrap', 'impact-custom');
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const completeQuest = () => {
    if (armorUnlocked) {
      onComplete();
    } else {
      alert('Complete at least 1 successful experiment with force < 30N to unlock the armor!');
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const getForceColor = (force) => {
    if (force < 20) return '#10B981'; // Very Safe - green
    if (force < 40) return '#22C55E'; // Safe - light green
    if (force < 60) return '#F59E0B'; // Risky - yellow
    if (force < 80) return '#EF4444'; // Dangerous - red
    return '#7C3AED'; // Critical - purple
  };

  const getSafetyLevel = (force) => {
    if (force < 20) return 'Very Safe';
    if (force < 40) return 'Safe';
    if (force < 60) return 'Risky';
    if (force < 80) return 'Dangerous';
    return 'Critical';
  };

  const getMaterialEffectiveness = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return 0;
    return ((1 - material.stiffness) * 100).toFixed(0);
  };

  // Safe value getter functions to prevent undefined errors
  const getCurrentForce = () => {
    return currentExperiment ? currentExperiment.force : 0;
  };

  const getCurrentTime = () => {
    return currentExperiment ? currentExperiment.time : 0;
  };

  const getCurrentImpulse = () => {
    return currentExperiment ? currentExperiment.impulse : 0;
  };

  const getCurrentMomentumChange = () => {
    return currentExperiment ? currentExperiment.momentumChange : 0;
  };

  const getCurrentImpactVelocity = () => {
    return currentExperiment ? currentExperiment.impactVelocity : 0;
  };

  const getCurrentSurvivalChance = () => {
    return currentExperiment ? currentExperiment.survivalChance : 0;
  };

  return (
    <div className="operation-cushion-impact">
      {/* Enhanced Header */}
      <div className="quest-header">
        <div className="header-top">
          <button className="back-button" onClick={() => navigate('menu')}>
            ← Back to Menu
          </button>
          <div className="quest-progress">
            <span>Experiments: {experiments.length}</span>
            <span>Success Rate: {experiments.filter(e => e.survived).length}/{experiments.length || 0}</span>
          </div>
        </div>
        <h1>🛡️ Operation Cushion Impact</h1>
        <div className="quest-context">
          <p>🚨 <strong>Emergency Mission:</strong> Protect fragile egg creatures from meteor impacts! Design the best cushion system using impulse physics.</p>
          <div className="mission-badge">
            <span className="badge-item">🥚 Save the Eggs</span>
            <span className="badge-item">📚 Learn Impulse</span>
            <span className="badge-item">🛡️ Earn Armor</span>
          </div>
        </div>
      </div>

      <div className="quest-content">
        {/* Enhanced Left Panel */}
        <div className="control-panel">
          <div className="panel-section">
            <div className="section-header" onClick={() => setShowTheory(!showTheory)}>
              <h3>📚 Impulse-Momentum Theorem</h3>
              <span className="toggle-icon">{showTheory ? '▼' : '▶'}</span>
            </div>
            {showTheory && (
              <div className="theory-card">
                <div className="theory-formula">
                  <div className="formula-main">J = F × Δt = m × Δv</div>
                  <div className="formula-explanation">Impulse = Force × Time = Mass × Velocity Change</div>
                </div>
                
                <div className="principle-key">
                  <div className="principle-item">
                    <div className="principle-icon">⏱️</div>
                    <div className="principle-text">
                      <strong>Longer Impact Time</strong>
                      <span>Smaller Force</span>
                    </div>
                  </div>
                  <div className="principle-item">
                    <div className="principle-icon">🛡️</div>
                    <div className="principle-text">
                      <strong>Cushioning</strong>
                      <span>Increases Time</span>
                    </div>
                  </div>
                </div>

                <div className="impulse-demonstration">
                  <h4>Force-Time Comparison:</h4>
                  <div className="force-comparison">
                    <div className="force-type">
                      <div className="force-label">Hard Surface</div>
                      <div className="force-bar hard-force">
                        <div className="bar-fill"></div>
                        <div className="bar-label">High Force, Short Time</div>
                      </div>
                    </div>
                    <div className="force-type">
                      <div className="force-label">Soft Surface</div>
                      <div className="force-bar soft-force">
                        <div className="bar-fill"></div>
                        <div className="bar-label">Low Force, Long Time</div>
                      </div>
                    </div>
                  </div>
                  <div className="impulse-note">
                    💡 Same Impulse = Same Area Under Curve
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="panel-section">
            <h3>🛠️ Cushion Materials</h3>
            <div className="material-grid">
              {materials.map(material => (
                <div
                  key={material.id}
                  className={`material-card ${selectedMaterial === material.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMaterial(material.id)}
                  style={{ 
                    borderColor: material.color,
                    background: `linear-gradient(135deg, ${material.color}20, ${material.color}10)`
                  }}
                >
                  <div className="material-header">
                    <div className="material-emoji" style={{ backgroundColor: material.color }}>
                      {material.emoji}
                    </div>
                    <div className="material-sound">{material.sound}</div>
                  </div>
                  <div className="material-info">
                    <div className="material-name">{material.name}</div>
                    <div className="material-desc">{material.description}</div>
                    <div className="material-stats">
                      <div className="stat">
                        <span className="stat-label">Softness</span>
                        <div className="stat-bar">
                          <div 
                            className="stat-fill" 
                            style={{
                              width: `${(1 - material.stiffness) * 100}%`,
                              backgroundColor: material.color
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Impact Time</span>
                        <span className="stat-value">{(material.impactTime * 1000).toFixed(0)}ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h3>🎮 Experiment Controls</h3>
            
            <div className="control-group">
              <label className="control-label">
                Drop Height: <span className="value-display">{dropHeight.toFixed(1)} meters</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={dropHeight}
                onChange={(e) => setDropHeight(parseFloat(e.target.value))}
                disabled={isDropping}
                className="height-slider"
              />
              <div className="height-markers">
                <span>1m (Safe)</span>
                <span>3m (Risky)</span>
                <span>5m (Extreme)</span>
              </div>
            </div>

            <div className="experiment-buttons">
              <button
                className={`drop-btn ${!selectedMaterial || isDropping ? 'disabled' : ''}`}
                onClick={performExperiment}
                disabled={!selectedMaterial || isDropping}
              >
                <span className="btn-icon">🥚</span>
                <span className="btn-text">Drop Egg!</span>
                {selectedMaterial && (
                  <span className="btn-material">
                    on {materials.find(m => m.id === selectedMaterial)?.name}
                  </span>
                )}
              </button>

              <button
                className="reset-btn"
                onClick={resetExperiment}
                disabled={isDropping}
              >
                <span className="btn-icon">🔄</span>
                Reset Experiment
              </button>
            </div>

            {selectedMaterial && (
              <div className="material-preview">
                <div className="preview-header">Selected: {materials.find(m => m.id === selectedMaterial)?.name}</div>
                <div className="preview-stats">
                  <div className="preview-stat">
                    <span>Effectiveness</span>
                    <strong>{getMaterialEffectiveness(selectedMaterial)}%</strong>
                  </div>
                  <div className="preview-stat">
                    <span>Expected Force</span>
                    <strong>~{calculateImpactPhysics(materials.find(m => m.id === selectedMaterial), dropHeight).averageForce.toFixed(0)}N</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Simulation Panel */}
        <div className="simulation-panel">
          <div className="simulation-header">
            <h3>🔬 Impact Laboratory</h3>
            <div className="simulation-info">
              <span>Mass: {EGG_MASS}kg</span>
              <span>Gravity: {GRAVITY}m/s²</span>
            </div>
          </div>

          <div className="drop-chamber">
            <div className="chamber-walls">
              <div className="wall left"></div>
              <div className="wall right"></div>
              <div className="wall back"></div>
            </div>
            
            <div className="height-indicator">
              <span className="height-value">{dropHeight.toFixed(1)}m</span>
              <div className="height-scale">
                {[5, 4, 3, 2, 1].map(height => (
                  <div 
                    key={height} 
                    className={`scale-mark ${dropHeight >= height ? 'active' : ''}`}
                    style={{ top: `${(5 - height) * 20}%` }}
                  >
                    {height}m
                  </div>
                ))}
              </div>
            </div>

            <div
              ref={eggRef}
              className="egg-creature"
              style={{ '--drop-height': dropHeight }}
            >
              <div className="egg-body">
                <div className="egg-face">
                  <div className="eyes">
                    <div className="eye"></div>
                    <div className="eye"></div>
                  </div>
                  <div className="mouth"></div>
                </div>
                {isDropping && <div className="falling-trail"></div>}
              </div>
              <div className="egg-mass-label">{EGG_MASS}kg</div>
            </div>

            <div
              ref={platformRef}
              className="impact-platform"
              style={{
                backgroundColor: selectedMaterial 
                  ? materials.find(m => m.id === selectedMaterial)?.color 
                  : '#6B7280',
                background: selectedMaterial 
                  ? `linear-gradient(135deg, ${materials.find(m => m.id === selectedMaterial)?.color}, ${materials.find(m => m.id === selectedMaterial)?.color}CC)`
                  : '#6B7280'
              }}
            >
              {selectedMaterial && (
                <div className="platform-label">
                  <span className="platform-emoji">
                    {materials.find(m => m.id === selectedMaterial)?.emoji}
                  </span>
                  <span className="platform-name">
                    {materials.find(m => m.id === selectedMaterial)?.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Results Display */}
          {showResults && currentExperiment && (
            <div className="results-panel">
              <div className="results-header">
                <h3>📊 Impact Analysis</h3>
                <div className="experiment-number">#{experiments.length}</div>
              </div>
              
              <div className={`survival-status ${eggSurvived ? 'survived' : 'failed'}`}>
                <div className="status-icon">
                  {eggSurvived ? '✅ Mission Success!' : '💔 Mission Failed'}
                </div>
                <div className="status-details">
                  <div className="status-text">
                    {eggSurvived ? 'Egg Creature Protected!' : 'Egg Creature Damaged!'}
                  </div>
                  <div className="status-subtext">
                    Survival Chance: {(getCurrentSurvivalChance() * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="physics-results">
                <div className="result-grid">
                  <div className="result-item">
                    <div className="result-icon">💥</div>
                    <div className="result-content">
                      <span className="label">Impact Force</span>
                      <span 
                        className="value"
                        style={{ color: getForceColor(getCurrentForce()) }}
                      >
                        {getCurrentForce().toFixed(1)} N
                      </span>
                      <div className="safety-level" style={{ 
                        backgroundColor: getForceColor(getCurrentForce()) + '20',
                        color: getForceColor(getCurrentForce())
                      }}>
                        {getSafetyLevel(getCurrentForce())}
                      </div>
                    </div>
                  </div>
                  
                  <div className="result-item">
                    <div className="result-icon">⏱️</div>
                    <div className="result-content">
                      <span className="label">Impact Time</span>
                      <span className="value">
                        {(getCurrentTime() * 1000).toFixed(1)} ms
                      </span>
                    </div>
                  </div>
                  
                  <div className="result-item">
                    <div className="result-icon">⚡</div>
                    <div className="result-content">
                      <span className="label">Impulse</span>
                      <span className="value">
                        {getCurrentImpulse().toFixed(3)} N·s
                      </span>
                    </div>
                  </div>
                  
                  <div className="result-item">
                    <div className="result-icon">🎯</div>
                    <div className="result-content">
                      <span className="label">Momentum Change</span>
                      <span className="value">
                        {getCurrentMomentumChange().toFixed(3)} kg·m/s
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="impulse-verification">
                <h4>🔍 Impulse-Momentum Verification</h4>
                <div className="verification-steps">
                  <div className="verification-step">
                    <span className="step-label">F × Δt =</span>
                    <span className="step-value">
                      {getCurrentForce().toFixed(1)} × {getCurrentTime().toFixed(3)}
                    </span>
                    <span className="step-result">= {getCurrentImpulse().toFixed(3)} N·s</span>
                  </div>
                  <div className="verification-step">
                    <span className="step-label">m × Δv =</span>
                    <span className="step-value">
                      {EGG_MASS} × {getCurrentImpactVelocity().toFixed(2)}
                    </span>
                    <span className="step-result">= {getCurrentMomentumChange().toFixed(3)} kg·m/s</span>
                  </div>
                </div>
                <div className={`verification-note ${Math.abs(getCurrentImpulse() - getCurrentMomentumChange()) < 0.01 ? 'valid' : 'invalid'}`}>
                  {Math.abs(getCurrentImpulse() - getCurrentMomentumChange()) < 0.01 
                    ? '✓ Impulse equals momentum change (J = Δp)'
                    : '⚠ Small calculation variance due to simulation'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Experiment History */}
      {experiments.length > 0 && (
        <div className="experiment-history">
          <div className="history-header">
            <h3>📈 Experiment Log</h3>
            <div className="history-stats">
              <span>Total: {experiments.length}</span>
              <span>Success: {experiments.filter(e => e.survived).length}</span>
              <span>Rate: {experiments.length > 0 ? ((experiments.filter(e => e.survived).length / experiments.length) * 100).toFixed(0) : 0}%</span>
            </div>
          </div>
          <div className="history-table">
            <div className="table-header">
              <span>Material</span>
              <span>Height</span>
              <span>Force</span>
              <span>Time</span>
              <span>Impulse</span>
              <span>Result</span>
            </div>
            <div className="table-body">
              {experiments.slice().reverse().map((exp, index) => (
                <div key={index} className={`table-row ${exp.survived ? 'survived' : 'broken'}`}>
                  <span className="material-cell">
                    <span className="material-emoji-small">
                      {materials.find(m => m.name === exp.material)?.emoji}
                    </span>
                    {exp.material}
                  </span>
                  <span>{exp.height}m</span>
                  <span style={{ color: getForceColor(exp.force) }}>
                    {exp.force.toFixed(1)}N
                  </span>
                  <span>{(exp.time * 1000).toFixed(1)}ms</span>
                  <span>{exp.impulse.toFixed(3)}</span>
                  <span className={`result-cell ${exp.survived ? 'survived' : 'broken'}`}>
                    {exp.survived ? '✅ Safe' : '💔 Broken'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Assessment Section */}
      <div className="assessment-section">
        <div className="assessment-header">
          <h3>📝 Impulse Analysis & Armor Unlock</h3>
          {armorUnlocked && (
            <div className="armor-unlocked-badge">
              🛡️ Armor Unlocked!
            </div>
          )}
        </div>
        
        <div className="analysis-questions">
          <div className="question-card">
            <div className="question-header">
              <span className="question-number">1</span>
              <span className="question-topic">Force-Time Relationship</span>
            </div>
            <p>How does increasing impact time affect the force on the egg? Use your experimental data as evidence.</p>
            <textarea 
              placeholder="Based on your experiments, explain the relationship between impact time and force. Which materials provided the best protection and why?"
              rows="3"
            ></textarea>
          </div>
          
          <div className="question-card">
            <div className="question-header">
              <span className="question-number">2</span>
              <span className="question-topic">Impulse Calculation</span>
            </div>
            <p>Calculate the impulse for a {EGG_MASS}kg egg dropped from {dropHeight.toFixed(1)}m onto your selected material.</p>
            <textarea 
              placeholder={`Show your calculation using J = F × Δt = m × Δv\nImpact velocity: ${getCurrentImpactVelocity().toFixed(2)} m/s`}
              rows="3"
            ></textarea>
          </div>
          
          <div className="question-card">
            <div className="question-header">
              <span className="question-number">3</span>
              <span className="question-topic">Real-World Application</span>
            </div>
            <p>How do airbags, crumple zones, and helmet padding use the impulse-momentum principle?</p>
            <textarea 
              placeholder="Connect your cushion experiment to real-world safety devices. How do they increase impact time to reduce force?"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div className="completion-section">
          <div className="completion-requirements">
            <h4>🛡️ Impact Reducer Armor Requirements:</h4>
            <ul>
              <li className={experiments.length >= 1 ? 'completed' : ''}>
                {experiments.length >= 1 ? '✓' : '○'} Complete at least 1 experiment
              </li>
              <li className={experiments.some(e => e.survived && e.force < 30) ? 'completed' : ''}>
                {experiments.some(e => e.survived && e.force < 30) ? '✓' : '○'} Achieve force below 30N in one experiment
              </li>
              <li className={experiments.filter(e => e.survived).length >= 1 ? 'completed' : ''}>
                {experiments.filter(e => e.survived).length >= 1 ? '✓' : '○'} Successfully protect at least one egg
              </li>
            </ul>
          </div>

          <button 
            className={`complete-quest-btn ${armorUnlocked ? 'unlocked' : 'locked'}`}
            onClick={completeQuest}
          >
            {armorUnlocked ? (
              <>
                <span className="btn-icon">🛡️</span>
                Claim Impact Reducer Armor!
              </>
            ) : (
              <>
                <span className="btn-icon">🔒</span>
                Complete Requirements to Unlock Armor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationCushionImpact;