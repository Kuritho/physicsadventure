import React, { useState, useRef, useEffect } from 'react';
import './ArchersChallenge.css';

const ArchersChallenge = ({ onComplete, navigate }) => {
  const [currentAngle, setCurrentAngle] = useState(45);
  const [isLaunching, setIsLaunching] = useState(false);
  const [trials, setTrials] = useState([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [targetDistance, setTargetDistance] = useState(40);
  const [velocity] = useState(25);
  const [currentFlightData, setCurrentFlightData] = useState(null);
  const [arrowPosition, setArrowPosition] = useState({ x: 0, y: 0, rotation: 0 });
  const [showHitResult, setShowHitResult] = useState(false);
  const [hitSuccess, setHitSuccess] = useState(false);
  const [arrowStuck, setArrowStuck] = useState(false);
  const [stuckPosition, setStuckPosition] = useState(null);
  
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);
  const arrowRef = useRef(null);
  const targetRef = useRef(null);

  // Physics constants
  const GRAVITY = 9.81;
  const TARGET_TOLERANCE = 2.5;
  const PIXELS_PER_METER = 8;

  // Required angles for learning objectives
  const LEARNING_ANGLES = [15, 30, 45, 60, 75];

  // Calculate projectile motion values
  const calculateProjectileMotion = (angle) => {
    const angleRad = (angle * Math.PI) / 180;
    const vx = velocity * Math.cos(angleRad);
    const vy = velocity * Math.sin(angleRad);
    
    const timeOfFlight = (2 * velocity * Math.sin(angleRad)) / GRAVITY;
    const maxHeight = (Math.pow(velocity * Math.sin(angleRad), 2)) / (2 * GRAVITY);
    const range = (Math.pow(velocity, 2) * Math.sin(2 * angleRad)) / GRAVITY;
    
    const distanceToTarget = Math.abs(range - targetDistance);
    const success = distanceToTarget <= TARGET_TOLERANCE;
    
    return {
      angle,
      velocity,
      vx,
      vy,
      timeOfFlight,
      maxHeight,
      range,
      distanceToTarget,
      success
    };
  };

  // Calculate arrow rotation during flight
  const calculateArrowRotation = (elapsed, theoretical) => {
    if (elapsed === 0) return -currentAngle; // Start with launch angle
    
    const currentVy = theoretical.vy - (GRAVITY * elapsed);
    const rotation = Math.atan2(currentVy, theoretical.vx) * (180 / Math.PI);
    return rotation;
  };

  // Launch simulation
  const launchProjectile = () => {
    if (isLaunching) return;
    
    setIsLaunching(true);
    setShowHitResult(false);
    setArrowStuck(false);
    setStuckPosition(null);
    setArrowPosition({ x: 0, y: 0, rotation: -currentAngle });
    
    const theoretical = calculateProjectileMotion(currentAngle);
    setCurrentFlightData({
      time: 0,
      distance: 0,
      height: 0,
      ...theoretical
    });
    
    startTimeRef.current = performance.now();

    const animate = (currentTime) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime;
      
      const elapsed = (currentTime - startTimeRef.current) / 1000;
      
      if (elapsed > theoretical.timeOfFlight) {
        // Flight complete
        const finalDistance = theoretical.range;
        const distanceToTarget = Math.abs(finalDistance - targetDistance);
        const success = distanceToTarget <= TARGET_TOLERANCE;
        
        const finalData = {
          ...theoretical,
          time: theoretical.timeOfFlight,
          distance: finalDistance,
          height: 0,
          success: success,
          distanceToTarget: distanceToTarget
        };
        
        setCurrentFlightData(finalData);
        
        if (success) {
          // Arrow hits target - stick it in the bullseye
          setArrowStuck(true);
          setStuckPosition({
            x: targetDistance, // Stick at target position
            y: 0,
            rotation: -45 // Stuck at an angle into the target
          });
          setArrowPosition({ 
            x: targetDistance, 
            y: 0, 
            rotation: -45 
          });
        } else {
          // Arrow misses - lie flat on ground
          setArrowPosition({ 
            x: finalDistance, 
            y: 0, 
            rotation: 0 
          });
        }
        
        // Show hit result
        setHitSuccess(success);
        setShowHitResult(true);
        
        // Record trial with actual hit result
        recordTrial(finalData);
        setIsLaunching(false);
        cancelAnimationFrame(animationRef.current);
        return;
      }
      
      // Update current position
      const currentDistance = theoretical.vx * elapsed;
      const currentHeight = (theoretical.vy * elapsed) - (0.5 * GRAVITY * Math.pow(elapsed, 2));
      
      // Calculate arrow rotation
      const rotation = calculateArrowRotation(elapsed, theoretical);
      
      setArrowPosition({
        x: currentDistance,
        y: Math.max(0, currentHeight),
        rotation: rotation
      });
      
      setCurrentFlightData({
        ...theoretical,
        time: elapsed,
        distance: currentDistance,
        height: Math.max(0, currentHeight)
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Record trial data
  const recordTrial = (data) => {
    const newTrial = {
      trialNumber: trials.length + 1,
      angle: data.angle,
      range: data.range,
      timeOfFlight: data.timeOfFlight,
      maxHeight: data.maxHeight,
      success: data.success,
      distanceToTarget: data.distanceToTarget,
      targetDistance: targetDistance
    };
    
    setTrials(prev => [...prev, newTrial]);
  };

  // Reset current shot
  const resetShot = () => {
    setIsLaunching(false);
    setCurrentFlightData(null);
    setShowHitResult(false);
    setArrowStuck(false);
    setStuckPosition(null);
    setArrowPosition({ x: 0, y: 0, rotation: 0 });
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Assessment functions
  const getAngleAnalysis = () => {
    const angleData = {};
    
    LEARNING_ANGLES.forEach(angle => {
      const angleTrials = trials.filter(trial => trial.angle === angle);
      if (angleTrials.length > 0) {
        const ranges = angleTrials.map(t => t.range);
        const avgRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
        const hitRate = (angleTrials.filter(t => t.success).length / angleTrials.length) * 100;
        const theoretical = calculateProjectileMotion(angle);
        
        angleData[angle] = {
          trials: angleTrials.length,
          avgRange,
          hitRate,
          theoreticalRange: theoretical.range,
          maxHeight: theoretical.maxHeight,
          timeOfFlight: theoretical.timeOfFlight
        };
      }
    });
    
    return angleData;
  };

  const evaluateUnderstanding = () => {
    const analysis = getAngleAnalysis();
    const testedAngles = Object.keys(analysis).map(Number);
    
    if (testedAngles.length < 3) {
      return {
        score: 0,
        feedback: ["Test at least 3 different angles to begin assessment"],
        passed: false
      };
    }

    let score = 0;
    const feedback = [];
    const insights = [];

    // Check for 45° maximum range discovery
    if (testedAngles.includes(45)) {
      const rangeAt45 = analysis[45].avgRange;
      const otherRanges = testedAngles
        .filter(angle => angle !== 45)
        .map(angle => analysis[angle].avgRange);
      
      if (otherRanges.every(range => range <= rangeAt45)) {
        score += 30;
        feedback.push("✓ Correctly identified that 45° gives maximum range");
        insights.push("45° launch angle produces the maximum horizontal distance");
      }
    }

    // Check complementary angles understanding
    const has30and60 = testedAngles.includes(30) && testedAngles.includes(60);
    const has15and75 = testedAngles.includes(15) && testedAngles.includes(75);
    
    if (has30and60) {
      const range30 = analysis[30].avgRange;
      const range60 = analysis[60].avgRange;
      if (Math.abs(range30 - range60) < 5) {
        score += 25;
        feedback.push("✓ Discovered complementary angles (30° & 60°) give similar ranges");
        insights.push("Complementary angles (θ and 90°-θ) produce equal ranges");
      }
    }

    if (has15and75) {
      const range15 = analysis[15].avgRange;
      const range75 = analysis[75].avgRange;
      if (Math.abs(range15 - range75) < 5) {
        score += 25;
        feedback.push("✓ Discovered complementary angles (15° & 75°) give similar ranges");
      }
    }

    // Check data collection thoroughness
    if (testedAngles.length >= 5) {
      score += 20;
      feedback.push("✓ Thorough testing across all recommended angles");
    }

    // Additional insights based on data
    if (testedAngles.length >= 3) {
      const angles = [...testedAngles].sort((a, b) => a - b);
      const ranges = angles.map(angle => analysis[angle].avgRange);
      
      // Check parabolic pattern
      if (ranges[0] < ranges[1] && ranges[1] > ranges[2]) {
        insights.push("Range follows a parabolic relationship with launch angle");
      }
      
      // Flight time insights
      if (testedAngles.includes(15) && testedAngles.includes(75)) {
        insights.push("Lower angles (<30°) have shorter flight times");
        insights.push("Higher angles (>60°) reach greater heights");
      }
    }

    return {
      score: Math.min(100, score),
      feedback,
      insights,
      passed: score >= 70,
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
    };
  };

  const completeAssessment = () => {
    const assessment = evaluateUnderstanding();
    
    if (assessment.passed) {
      setAssessmentCompleted(true);
      alert(`🎉 Excellent! You've mastered projectile motion!\nScore: ${assessment.score}%\n\nYour Angle Optimizer is now unlocked!`);
    } else {
      alert(`📊 Assessment Score: ${assessment.score}%\n\nFocus on:\n• Testing all angles from 15° to 75°\n• Comparing complementary angles\n• Discovering that 45° gives maximum range`);
    }
  };

  const completeQuest = () => {
    if (!assessmentCompleted) {
      alert("Complete the assessment first to demonstrate your understanding!");
      return;
    }

    const testedAngles = [...new Set(trials.map(t => t.angle))];
    const hasAllAngles = LEARNING_ANGLES.every(angle => testedAngles.includes(angle));
    
    if (hasAllAngles) {
      onComplete();
    } else {
      const missing = LEARNING_ANGLES.filter(angle => !testedAngles.includes(angle));
      alert(`Test these angles to complete your research: ${missing.join('°, ')}°`);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const analysis = getAngleAnalysis();
  const assessment = evaluateUnderstanding();
  const theoretical = calculateProjectileMotion(currentAngle);

  return (
    <div className="archers-challenge">
      <div className="quest-header">
        <button className="back-button" onClick={() => navigate('menu')}>
          ← Back to Menu
        </button>
        <h1>🏹 Archer's Challenge</h1>
        <p className="quest-description">
          Help the master archer find the perfect launch angle! 
          Test different angles and discover the physics of projectile motion.
        </p>
      </div>

      <div className="learning-objectives">
        <h3>🎯 Learning Goals</h3>
        <ul>
          <li>Discover how launch angle affects projectile range</li>
          <li>Understand complementary angles in projectile motion</li>
          <li>Find the optimal angle for maximum distance</li>
          <li>Analyze the independence of horizontal and vertical motion</li>
        </ul>
      </div>

      <div className="experiment-area">
        <div className="controls-panel">
          <div className="control-group">
            <h4>Target Distance: {targetDistance}m</h4>
            <input
              type="range"
              min="20"
              max="70"
              value={targetDistance}
              onChange={(e) => setTargetDistance(Number(e.target.value))}
              className="distance-slider"
            />
            <div className="slider-labels">
              <span>20m</span>
              <span>45m</span>
              <span>70m</span>
            </div>
          </div>

          <div className="angle-selection">
            <h4>Launch Angle: {currentAngle}°</h4>
            <div className="angle-buttons">
              {LEARNING_ANGLES.map(angle => (
                <button
                  key={angle}
                  className={`angle-btn ${currentAngle === angle ? 'active' : ''}`}
                  onClick={() => setCurrentAngle(angle)}
                  disabled={isLaunching}
                >
                  {angle}°
                </button>
              ))}
            </div>
          </div>

          <div className="physics-preview">
            <h4>Physics Prediction</h4>
            <div className="prediction-data">
              <div>Range: <strong>{theoretical.range.toFixed(1)}m</strong></div>
              <div>Max Height: <strong>{theoretical.maxHeight.toFixed(1)}m</strong></div>
              <div>Flight Time: <strong>{theoretical.timeOfFlight.toFixed(2)}s</strong></div>
              {/* <div className={`prediction ${theoretical.success ? 'hit' : 'miss'}`}>
                {theoretical.success ? '🎯 Predicted Hit' : '❌ Predicted Miss'}
              </div> */}
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="launch-btn"
              onClick={launchProjectile}
              disabled={isLaunching}
            >
              {isLaunching ? '🚀 Launching...' : '🏹 Launch Arrow'}
            </button>
            <button 
              className="reset-btn"
              onClick={resetShot}
              disabled={!currentFlightData && !isLaunching}
            >
              🔄 Reset
            </button>
          </div>

          {showHitResult && (
            <div className={`hit-result ${hitSuccess ? 'success' : 'failure'}`}>
              <h4>{hitSuccess ? '🎯 Bullseye! Arrow Stuck in Target!' : '❌ Missed Target'}</h4>
              <p>
                {hitSuccess 
                  ? 'Perfect hit! The arrow is stuck in the bullseye.' 
                  : `Missed by ${currentFlightData.distanceToTarget.toFixed(1)}m`
                }
              </p>
            </div>
          )}

          {currentFlightData && (
            <div className="live-data">
              <h4>Current Flight</h4>
              <div className="data-grid">
                <div>Time: <strong>{currentFlightData.time.toFixed(2)}s</strong></div>
                <div>Distance: <strong>{currentFlightData.distance.toFixed(1)}m</strong></div>
                <div>Height: <strong>{currentFlightData.height.toFixed(1)}m</strong></div>
              </div>
            </div>
          )}
        </div>

        <div className="visualization-area">
          <div className="range-display">
            {/* Target */}
            <div 
              ref={targetRef}
              className="target-marker" 
              style={{ left: `${(targetDistance / 70) * 100}%` }}
            >
              <div className="target">
                <div className="target-rings">
                  <div className="ring ring-1"></div>
                  <div className="ring ring-2"></div>
                  <div className="ring ring-3"></div>
                  <div className="bullseye"></div>
                </div>
              </div>
              <div className="target-label">{targetDistance}m</div>
            </div>
            
            {/* Arrow */}
            <div 
              ref={arrowRef}
              className={`flying-arrow ${arrowStuck ? 'stuck' : ''}`}
              style={{
                left: `${(arrowPosition.x / 70) * 100}%`,
                bottom: `${(arrowPosition.y / 20) * 100}%`,
                transform: `rotate(${arrowPosition.rotation}deg)`,
                zIndex: arrowStuck ? 25 : 20
              }}
            >
              <div className="arrow-shaft"></div>
              <div className="arrow-head"></div>
              <div className="arrow-fletching"></div>
            </div>

            {/* Archer */}
            <div className="archer">
              <div className="archer-body"></div>
              <div className="archer-bow"></div>
            </div>
          </div>
          
          <div className="trajectory-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="grid-line">
                <span>{i * 10}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="data-section">
        <div className="trials-records">
          <h3>Experimental Data</h3>
          {trials.length === 0 ? (
            <div className="no-data">
              <p>Launch some arrows to collect data!</p>
              <p>Test angles: 15°, 30°, 45°, 60°, 75°</p>
            </div>
          ) : (
            <div className="trials-table">
              <table>
                <thead>
                  <tr>
                    <th>Trial</th>
                    <th>Angle</th>
                    <th>Range</th>
                    <th>Max Height</th>
                    <th>Flight Time</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {trials.slice(-10).reverse().map((trial) => (
                    <tr key={trial.trialNumber} className={trial.success ? 'success' : 'miss'}>
                      <td>#{trial.trialNumber}</td>
                      <td>{trial.angle}°</td>
                      <td>{trial.range.toFixed(1)}m</td>
                      <td>{trial.maxHeight.toFixed(1)}m</td>
                      <td>{trial.timeOfFlight.toFixed(2)}s</td>
                      <td>
                        {trial.success 
                          ? '🎯 Hit - Arrow Stuck!' 
                          : `Miss by ${trial.distanceToTarget.toFixed(1)}m`
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="analysis-section">
          <div className="analysis-controls">
            <button 
              onClick={() => setShowAnalysis(!showAnalysis)}
              disabled={trials.length === 0}
            >
              {showAnalysis ? '📊 Hide Analysis' : '📊 Show Analysis'}
            </button>
            
            <button 
              onClick={completeAssessment}
              disabled={trials.length === 0}
            >
              📝 Complete Assessment
            </button>
            
            <button 
              onClick={completeQuest}
              disabled={!assessmentCompleted}
              className="complete-btn"
            >
              {assessmentCompleted ? '🎯 Get Angle Optimizer' : '🔒 Complete Assessment'}
            </button>
          </div>

          {showAnalysis && trials.length > 0 && (
            <div className="angle-analysis">
              <h4>Angle vs Range Analysis</h4>
              <div className="analysis-grid">
                {LEARNING_ANGLES.map(angle => {
                  const data = analysis[angle];
                  return data ? (
                    <div key={angle} className="angle-data">
                      <h5>{angle}°</h5>
                      <div>Avg Range: {data.avgRange.toFixed(1)}m</div>
                      <div>Hit Rate: {data.hitRate.toFixed(0)}%</div>
                      <div>Trials: {data.trials}</div>
                    </div>
                  ) : (
                    <div key={angle} className="angle-data untested">
                      <h5>{angle}°</h5>
                      <div>Not tested</div>
                    </div>
                  );
                })}
              </div>
              
              {assessment.feedback && (
                <div className="assessment-feedback">
                  <h4>Understanding Assessment</h4>
                  {assessment.feedback.map((item, index) => (
                    <div key={index} className="feedback-item">
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div> 
          )}
        </div>

        {assessmentCompleted && (
          <div className="reward-section">
            <div className="reward-badge">
              <h3>🎯 Angle Optimizer Unlocked!</h3>
              <p>You've demonstrated mastery of projectile motion physics!</p>
              <p>The Angle Optimizer will help you calculate perfect shots for any distance.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchersChallenge;