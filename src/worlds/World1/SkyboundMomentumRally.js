// ============================================
// FILE: src/worlds/World1/SkyboundMomentumRally.js
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import './SkyboundMomentumRally.css';

const SkyboundMomentumRally = ({ onComplete, navigate }) => {
  const [balloonSize, setBalloonSize] = useState(1.0);
  const [airPressure, setAirPressure] = useState(0);
  const [rocketVelocity, setRocketVelocity] = useState(0);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const [currentMode, setCurrentMode] = useState('inflate');
  const [hasReachedFinish, setHasReachedFinish] = useState(false);
  const [balloonStretch, setBalloonStretch] = useState(1.0);
  const [airRemaining, setAirRemaining] = useState(1.0);
  const [currentVelocity, setCurrentVelocity] = useState(0);

  const rocketRef = useRef(null);
  const trackRef = useRef(null);
  const animationRef = useRef(null);

  // Extended Physics Constants for 30m track
  const FINISH_LINE_DISTANCE = 30; // Extended to 30 meters
  const BALLOON_MASS = 0.015;
  const AIR_DENSITY = 1.225;
  const NOZZLE_AREA = 0.0001; // Slightly larger nozzle for longer distance
  const EFFICIENCY = 0.75; // Better efficiency for longer flights
  const AIR_RESISTANCE_COEFF = 0.008; // Reduced air resistance
  const BURST_PRESSURE = 3.5; // Higher burst pressure for more air capacity

  const calculateVolume = (size) => {
    const baseRadius = 0.15; // Larger base size
    const radius = baseRadius * Math.pow(size, 1/3);
    return (4/3) * Math.PI * Math.pow(radius, 3);
  };

  const calculateAirMass = (size) => {
    const volume = calculateVolume(size);
    const pressureFactor = 1 + (size - 1) * 0.4; // Higher pressure capability
    return volume * AIR_DENSITY * pressureFactor;
  };

  const calculateLaunchPhysics = () => {
    const airMass = calculateAirMass(balloonSize);
    const totalInitialMass = BALLOON_MASS + airMass;
    
    // Balanced exhaust velocity based on pressure and size
    const basePressure = Math.min(airPressure, BURST_PRESSURE - 0.5);
    const exhaustVelocity = 25 + (basePressure * 8); // More realistic velocity range
    
    const massRatio = totalInitialMass / BALLOON_MASS;
    const idealDeltaV = exhaustVelocity * Math.log(massRatio);
    
    // Better efficiency calculation based on nozzle design
    const nozzleEfficiency = 0.65 + (balloonSize * 0.05); // Larger balloons more efficient
    const realisticDeltaV = idealDeltaV * nozzleEfficiency * (1 - AIR_RESISTANCE_COEFF);
    
    // Improved flow rate calculation
    const pressureFactor = 1 + (basePressure * 0.3);
    const flowRate = NOZZLE_AREA * exhaustVelocity * pressureFactor;
    const thrustDuration = calculateVolume(balloonSize) / flowRate;
    const thrustForce = (airMass / thrustDuration) * exhaustVelocity;
    
    return {
      airMass,
      totalInitialMass,
      exhaustVelocity,
      idealDeltaV,
      realisticDeltaV,
      thrustDuration,
      thrustForce,
      massRatio,
      pressureFactor
    };
  };

  const simulateFlight = (physics, onProgress, onComplete) => {
    const { realisticDeltaV, thrustDuration, totalInitialMass, airMass, thrustForce, exhaustVelocity } = physics;
    
    const timeStep = 0.016;
    let time = 0;
    let distance = 0;
    let velocity = 0;
    let mass = totalInitialMass;
    let airMassRemaining = airMass;
    let maxVelocity = 0;
    
    // Variable thrust based on remaining air
    const initialThrustForce = thrustForce;
    const airMassFlowRate = airMass / thrustDuration;
    
    const simulateStep = () => {
      // Calculate current thrust (decreases as air depletes)
      const thrustRatio = airMassRemaining / airMass;
      const currentThrustForce = initialThrustForce * thrustRatio;
      
      if (time < thrustDuration && airMassRemaining > 0) {
        const acceleration = currentThrustForce / mass;
        velocity += acceleration * timeStep;
        mass -= airMassFlowRate * timeStep;
        airMassRemaining -= airMassFlowRate * timeStep;
      }
      
      // Progressive air resistance - increases with velocity
      const dragForce = 0.5 * AIR_DENSITY * AIR_RESISTANCE_COEFF * Math.pow(velocity, 2);
      const dragAcceleration = dragForce / mass;
      velocity -= dragAcceleration * timeStep;
      
      // Ensure velocity doesn't go negative
      velocity = Math.max(0, velocity);
      
      distance += velocity * timeStep;
      time += timeStep;
      maxVelocity = Math.max(maxVelocity, velocity);
      
      const airRemainingRatio = Math.max(0, airMassRemaining / airMass);
      setAirRemaining(airRemainingRatio);
      setCurrentVelocity(velocity);
      
      onProgress(distance, velocity, airRemainingRatio, maxVelocity);
      
      // Continue simulation until stopped or reached maximum distance
      const isMoving = velocity > 0.05;
      const withinBounds = distance < FINISH_LINE_DISTANCE * 1.5;
      const hasTimeRemaining = time < thrustDuration + 3; // Extra time for coasting
      
      if ((isMoving && withinBounds && hasTimeRemaining) || time < thrustDuration + 2) {
        animationRef.current = setTimeout(simulateStep, timeStep * 1000);
      } else {
        onComplete(distance, maxVelocity);
      }
    };
    
    simulateStep();
  };

  const handleInflate = () => {
    if (balloonSize < 3.2) {
      const newSize = Math.min(balloonSize + 0.18, 3.2);
      setBalloonSize(newSize);
      
      // Better pressure calculation
      const basePressure = (newSize - 1.0) * 1.5;
      const pressure = Math.min(basePressure, BURST_PRESSURE);
      setAirPressure(pressure);
      
      // Visual stretch effect
      if (newSize > 2.5) {
        const stretch = 1.0 + (newSize - 2.5) * 0.15; // Reduced stretch
        setBalloonStretch(stretch);
      }
      
      // Burst detection with pressure threshold
      if (pressure >= BURST_PRESSURE) {
        setTimeout(() => {
          alert('💥 Balloon Burst! Too much pressure! Reduce air for better control.');
          resetExperiment();
        }, 400);
        return;
      }
    }
  };

  const launchRocket = () => {
    if (isLaunching) return;
    
    setIsLaunching(true);
    setCurrentMode('launch');
    setAirRemaining(1.0);
    setCurrentVelocity(0);
    
    const physics = calculateLaunchPhysics();
    setRocketVelocity(physics.realisticDeltaV);
    
    const trackWidth = trackRef.current?.offsetWidth || 800;
    const pixelPerMeter = (trackWidth - 100) / FINISH_LINE_DISTANCE; // Adjusted for 30m

    simulateFlight(
      physics,
      (distance, velocity, airRatio, maxVel) => {
        setDistanceTraveled(distance);
        setCurrentVelocity(velocity);
        setAirRemaining(airRatio);
        
        if (rocketRef.current) {
          const translateX = distance * pixelPerMeter;
          // Scale rocket based on distance to maintain visibility
          const distanceScale = Math.max(0.3, 1 - (distance / FINISH_LINE_DISTANCE) * 0.3);
          const airScale = 0.6 + (0.4 * airRatio);
          const totalScale = distanceScale * airScale;
          
          rocketRef.current.style.transform = `translateX(${translateX}px) scale(${totalScale})`;
          rocketRef.current.style.opacity = Math.max(0.5, 1 - (distance / FINISH_LINE_DISTANCE) * 0.2);
        }
      },
      (finalDistance, maxVelocity) => {
        setIsLaunching(false);
        setShowResults(true);
        setCurrentMode('results');
        
        const reachedFinish = finalDistance >= FINISH_LINE_DISTANCE;
        setHasReachedFinish(reachedFinish);
        
        setMeasurements(prev => [...prev, {
          balloonSize: balloonSize.toFixed(2),
          distance: finalDistance.toFixed(2),
          maxVelocity: maxVelocity.toFixed(2),
          finalVelocity: currentVelocity.toFixed(2),
          airMass: physics.airMass.toFixed(4),
          thrustDuration: physics.thrustDuration.toFixed(2),
          reachedFinish: reachedFinish
        }]);
        
        if (reachedFinish) {
          setTimeout(() => {
            if (rocketRef.current) {
              rocketRef.current.classList.add('celebrate');
            }
          }, 500);
        }
      }
    );
  };

  const resetExperiment = () => {
    setBalloonSize(1.0);
    setAirPressure(0);
    setRocketVelocity(0);
    setDistanceTraveled(0);
    setIsLaunching(false);
    setShowResults(false);
    setCurrentMode('inflate');
    setHasReachedFinish(false);
    setBalloonStretch(1.0);
    setAirRemaining(1.0);
    setCurrentVelocity(0);
    
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    
    if (rocketRef.current) {
      rocketRef.current.style.transform = 'translateX(0px) scale(1)';
      rocketRef.current.style.opacity = '1';
      rocketRef.current.classList.remove('celebrate');
    }
  };

  const completeQuest = () => {
    if (hasReachedFinish) {
      onComplete();
    } else {
      alert('🚀 Launch a rocket that reaches the 30m finish line to win the festival ribbon!');
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  const physics = calculateLaunchPhysics();
  const estimatedDistance = physics.realisticDeltaV * 0.6; // Better estimation for longer distance
  const canReachFinish = estimatedDistance >= FINISH_LINE_DISTANCE;
  const inflationProgress = ((balloonSize - 1.0) / (3.2 - 1.0)) * 100;

  return (
    <div className="skybound-momentum-rally">
      <div className="quest-header">
        <button className="back-button" onClick={() => navigate('menu')}>
          ← Back to Valley
        </button>
        <h1>🎈 Skybound Momentum Rally - 30m Challenge</h1>
        <div className="quest-context">
          <p>🏁 Festival Grand Prix! Reach the 30-meter finish line using rocket physics!</p>
          <div className="finish-goal">
            🎯 Race Goal: {FINISH_LINE_DISTANCE}m | Current: {distanceTraveled.toFixed(1)}m
            {distanceTraveled > 0 && (
              <span className="progress-percent">
                ({((distanceTraveled / FINISH_LINE_DISTANCE) * 100).toFixed(1)}% of track)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="quest-content">
        <div className="control-panel">
          <div className="theory-section">
            <h3>🎯 Balanced Physics</h3>
            <div className="goal-card">
              <p><strong>Optimized Rocket Science:</strong> Balance air volume and pressure for maximum efficiency!</p>
              <div className="physics-stats">
                <div className="physics-stat">
                  <span>Air Capacity:</span>
                  <strong>{(physics.airMass * 1000).toFixed(0)}g</strong>
                </div>
                <div className="physics-stat">
                  <span>Exhaust Velocity:</span>
                  <strong>{physics.exhaustVelocity.toFixed(1)}m/s</strong>
                </div>
                <div className="physics-stat">
                  <span>Est. Range:</span>
                  <strong>{estimatedDistance.toFixed(1)}m</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="experiment-controls">
            <h3>🎮 Rocket Controls</h3>
            
            {currentMode === 'inflate' && (
              <div className="control-group">
                <div className="inflation-info">
                  <div className="inflation-stat">
                    <span>Balloon Size</span>
                    <strong>{balloonSize.toFixed(1)}</strong>
                  </div>
                  <div className="inflation-stat">
                    <span>Air Pressure</span>
                    <strong>{airPressure.toFixed(1)}</strong>
                  </div>
                </div>
                
                <button 
                  className="inflate-btn"
                  onClick={handleInflate}
                  disabled={balloonSize >= 3.2 || isLaunching}
                >
                  💨 Add Compressed Air
                </button>
                
                <div className="inflation-warning">
                  {balloonSize > 2.8 && "⚠️ Extreme Pressure! Risk of burst!"}
                  {balloonSize > 2.2 && balloonSize <= 2.8 && "🔶 High Pressure - Maximum thrust!"}
                  {balloonSize > 1.5 && balloonSize <= 2.2 && "✅ Good pressure for long flight"}
                </div>
                
                <div className="size-indicator">
                  <div className="size-labels">
                    <span>Small</span>
                    <span>Medium</span>
                    <span>Large</span>
                    <span>Max Power</span>
                  </div>
                  <div className="size-bar">
                    <div 
                      className="size-fill" 
                      style={{width: `${inflationProgress}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {currentMode === 'inflate' && balloonSize > 1.2 && (
              <button 
                className={`launch-btn ${canReachFinish ? 'can-finish' : 'cannot-finish'}`}
                onClick={launchRocket}
              >
                {canReachFinish ? 
                  '🚀 LAUNCH TO 30m!' : 
                  `🚀 Launch (Need ${(FINISH_LINE_DISTANCE - estimatedDistance).toFixed(1)}m more air power)`}
              </button>
            )}

            {(currentMode === 'results' || currentMode === 'launch') && (
              <button className="reset-btn" onClick={resetExperiment}>
                🔄 Build New Rocket
              </button>
            )}
          </div>

          {showResults && (
            <div className="results-panel">
              <h3>📊 Flight Performance</h3>
              <div className="result-cards">
                <div className="result-card">
                  <span className="result-label">Distance Achieved</span>
                  <span className="result-value">{distanceTraveled.toFixed(2)}m</span>
                </div>
                <div className="result-card">
                  <span className="result-label">Peak Velocity</span>
                  <span className="result-value">{rocketVelocity.toFixed(2)}m/s</span>
                </div>
                <div className="result-card">
                  <span className="result-label">Track Completion</span>
                  <span className="result-value">
                    {((distanceTraveled / FINISH_LINE_DISTANCE) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className={`result-card ${hasReachedFinish ? 'success' : 'warning'}`}>
                  <span className="result-label">30m Challenge</span>
                  <span className="result-value">
                    {hasReachedFinish ? '🏆 VICTORY!' : '🎯 Keep Trying!'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Simulation Panel for 30m */}
        <div className="simulation-panel">
          <div className="race-track" ref={trackRef}>
            <div className="track-markers">
              <div className="track-marker">Start</div>
              <div className="track-marker">5m</div>
              <div className="track-marker">10m</div>
              <div className="track-marker">15m</div>
              <div className="track-marker">20m</div>
              <div className="track-marker">25m</div>
              <div className="track-marker finish-marker">{FINISH_LINE_DISTANCE}m 🏁</div>
            </div>
            
            <div className="track-lane">
              <div 
                ref={rocketRef}
                className={`balloon-rocket ${isLaunching ? 'launching' : ''} ${hasReachedFinish ? 'celebrate' : ''}`}
              >
                <div 
                  className="balloon"
                  style={{
                    width: `${35 * balloonSize}px`,
                    height: `${45 * balloonSize * balloonStretch}px`
                  }}
                ></div>
                <div className="rocket-body"></div>
                <div className="exhaust"></div>
                <div className="exhaust-flame"></div>
                <div className="rocket-fins"></div>
              </div>
            </div>
            
            {/* Distance indicator that moves with rocket */}
            {distanceTraveled > 0 && (
              <div 
                className="distance-indicator"
                style={{
                  left: `${(distanceTraveled / FINISH_LINE_DISTANCE) * 95}%`
                }}
              >
                {distanceTraveled.toFixed(1)}m
              </div>
            )}
          </div>
          
          <div className="flight-data">
            <div className="data-item">
              <span>Real-time Speed</span>
              <strong>{currentVelocity.toFixed(1)} m/s</strong>
            </div>
            <div className="data-item">
              <span>Air Remaining</span>
              <strong>{(airRemaining * 100).toFixed(0)}%</strong>
            </div>
            <div className="data-item">
              <span>Distance Traveled</span>
              <strong>{distanceTraveled.toFixed(1)}m</strong>
            </div>
            <div className="data-item">
              <span>Track Progress</span>
              <strong>{((distanceTraveled / FINISH_LINE_DISTANCE) * 100).toFixed(1)}%</strong>
            </div>
          </div>

          <div className="physics-info">
            <div className="info-item">
              <span>Balloon Volume</span>
              <strong>{(calculateVolume(balloonSize) * 1000).toFixed(0)}L</strong>
            </div>
            <div className="info-item">
              <span>Thrust Duration</span>
              <strong>{physics.thrustDuration.toFixed(1)}s</strong>
            </div>
            <div className="info-item">
              <span>Exhaust Speed</span>
              <strong>{physics.exhaustVelocity.toFixed(1)}m/s</strong>
            </div>
            <div className="info-item">
              <span>Required for 30m</span>
              <strong className={canReachFinish ? 'success' : 'warning'}>
                {canReachFinish ? '✓ Ready' : 'More Air'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="assessment-section">
        <div className="explanation-input">
          <label>Explain how you balanced air volume and pressure to achieve the 30-meter distance:</label>
          <textarea 
            placeholder="To reach 30 meters, the balloon needs optimal balance between air volume and pressure. More volume stores more air mass for longer thrust duration, while higher pressure creates faster exhaust velocity. The key is finding the sweet spot where thrust force and duration combine for maximum distance..."
            rows="4"
          ></textarea>
        </div>

        <button 
          className={`complete-quest-btn ${hasReachedFinish ? 'enabled' : 'disabled'}`}
          onClick={completeQuest}
        >
          {hasReachedFinish ? 
            '🎈 Claim Your 30m Rocket Ribbon! 🏆' : 
            `🚀 Reach ${FINISH_LINE_DISTANCE}m to Win!`}
        </button>
      </div>
    </div>
  );
};

export default SkyboundMomentumRally;