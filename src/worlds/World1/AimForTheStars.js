import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AimForTheStars.css';

const HoverBallArena = ({ onComplete, navigate }) => {
  const [velocity, setVelocity] = useState(22);
  const [angle, setAngle] = useState(48);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showTarget, setShowTarget] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [constraintWarning, setConstraintWarning] = useState('');
  const [animationProgress, setAnimationProgress] = useState(0);
  const [showPhysicsTips, setShowPhysicsTips] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Enhanced physics constants
  const GRAVITY = 9.81;
  const CANVAS_SCALE = 5;
  const LAUNCH_X = 120;
  const LAUNCH_Y = 480;
  
  // Dynamic goal area based on level
  const goalConfigs = {
    1: { left: 450, right: 550, top: 320, bottom: 380, velocity: 22, angle: 48 },
    2: { left: 500, right: 580, top: 300, bottom: 360, velocity: 25, angle: 52 },
    3: { left: 550, right: 620, top: 280, bottom: 340, velocity: 28, angle: 55 }
  };

  const currentGoal = goalConfigs[currentLevel];

  // Memoized trajectory calculation with enhanced physics
  const calculateTrajectory = useCallback((v, a) => {
    const points = [];
    const radians = (a * Math.PI) / 180;
    const vx = v * Math.cos(radians);
    const vy = v * Math.sin(radians);
    
    const timeOfFlight = (2 * v * Math.sin(radians)) / GRAVITY;
    const dt = timeOfFlight / 150; // More points for smoother curve
    
    for (let t = 0; t <= timeOfFlight; t += dt) {
      const x = vx * t;
      const y = vy * t - 0.5 * GRAVITY * t * t;
      
      const canvasX = LAUNCH_X + x * CANVAS_SCALE;
      const canvasY = LAUNCH_Y - y * CANVAS_SCALE;
      
      if (canvasY > LAUNCH_Y) break;
      
      points.push({ x: canvasX, y: canvasY, t });
    }
    
    return points;
  }, [GRAVITY, CANVAS_SCALE, LAUNCH_X, LAUNCH_Y]);

  // Enhanced constraint checking with physics tips
  const checkConstraints = useCallback((v = velocity, a = angle) => {
    const trajectory = calculateTrajectory(v, a);
    
    if (trajectory.length === 0) {
      return { isValid: true, warning: '', tip: 'Increase velocity to reach the goal' };
    }

    const lastPoint = trajectory[trajectory.length - 1];
    const goalCenterX = (currentGoal.left + currentGoal.right) / 2;
    const goalCenterY = (currentGoal.top + currentGoal.bottom) / 2;
    
    // Check if ball lands within goal area
    const inGoalX = lastPoint.x >= currentGoal.left && lastPoint.x <= currentGoal.right;
    const inGoalY = lastPoint.y >= currentGoal.top && lastPoint.y <= currentGoal.bottom;
    
    if (inGoalX && inGoalY) {
      return { 
        isValid: true, 
        warning: '🎯 Perfect trajectory! Ready to score!',
        tip: 'Perfect! Your projectile motion calculations are spot on'
      };
    }

    // Enhanced physics-based feedback
    const distanceToGoal = Math.abs(lastPoint.x - goalCenterX);
    const heightDifference = Math.abs(lastPoint.y - goalCenterY);
    
    let warning = '';
    let tip = '';
    
    if (lastPoint.x < currentGoal.left) {
      warning = `📏 Too short by ${(distanceToGoal / CANVAS_SCALE).toFixed(1)}m`;
      tip = 'Try increasing velocity or using a lower angle for more range';
    } else if (lastPoint.x > currentGoal.right) {
      warning = `💨 Too far by ${(distanceToGoal / CANVAS_SCALE).toFixed(1)}m`;
      tip = 'Try decreasing velocity or using a higher angle for less range';
    } else if (lastPoint.y < currentGoal.top) {
      warning = `⬆️ Too high by ${(heightDifference / CANVAS_SCALE).toFixed(1)}m`;
      tip = 'Ball is overshooting vertically. Try a lower angle';
    } else {
      warning = `⬇️ Too low by ${(heightDifference / CANVAS_SCALE).toFixed(1)}m`;
      tip = 'Ball is falling short. Try a higher angle for more height';
    }

    return { isValid: true, warning, tip };
  }, [velocity, angle, calculateTrajectory, currentGoal, CANVAS_SCALE]);

  // Clean up animation
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Enhanced drawing with better visuals
  useEffect(() => {
    const constraintResult = checkConstraints();
    setConstraintWarning(constraintResult.warning);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawEnhancedScene(ctx, constraintResult);
    }
  }, [velocity, angle, isLaunching, showTarget, checkConstraints, animationProgress, currentLevel]);

  const drawEnhancedScene = (ctx, constraintResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Enhanced space background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0f2b');
    gradient.addColorStop(1, '#1a1f3b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Enhanced stars with twinkling effect
    ctx.fillStyle = 'white';
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.7;
      const size = Math.random() * 2 + 0.5;
      const opacity = Math.random() * 0.8 + 0.2;
      const twinkle = Math.sin(Date.now() * 0.001 + i) * 0.3 + 0.7;
      
      ctx.globalAlpha = opacity * twinkle;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw enhanced ground with texture
    ctx.fillStyle = '#1e4d2b';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
    
    // Ground texture
    ctx.fillStyle = '#2d6b3f';
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.fillRect(i, canvas.height - 60, 10, 5);
    }

    // Enhanced distance markers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px "Courier New", monospace';
    for (let i = 0; i <= 30; i += 5) {
      const x = LAUNCH_X + (i * 5) * CANVAS_SCALE / 5;
      if (x < canvas.width - 30) {
        ctx.fillText(`${i * 5}m`, x - 12, canvas.height - 35);
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - 50);
        ctx.lineTo(x, canvas.height - 40);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();
      }
    }

    // Enhanced goal area with glowing effect
    const goalGradient = ctx.createLinearGradient(
      currentGoal.left, currentGoal.top,
      currentGoal.right, currentGoal.bottom
    );
    goalGradient.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
    goalGradient.addColorStop(1, 'rgba(245, 158, 11, 0.3)');
    
    ctx.fillStyle = goalGradient;
    ctx.fillRect(currentGoal.left, currentGoal.top, currentGoal.right - currentGoal.left, currentGoal.bottom - currentGoal.top);
    
    // Goal border with glow
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 15;
    ctx.strokeRect(currentGoal.left, currentGoal.top, currentGoal.right - currentGoal.left, currentGoal.bottom - currentGoal.top);
    ctx.shadowBlur = 0;

    // Goal label with level indicator
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`🎯 LEVEL ${currentLevel} GOAL`, currentGoal.left + 10, currentGoal.top - 20);

    // Enhanced launcher with 3D effect
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(LAUNCH_X - 20, canvas.height - 90, 40, 40);
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(LAUNCH_X - 25, canvas.height - 95, 50, 10);
    
    // Launcher base
    ctx.fillStyle = '#374151';
    ctx.fillRect(LAUNCH_X - 30, canvas.height - 50, 60, 10);

    // Enhanced angle indicator
    const radians = (angle * Math.PI) / 180;
    const indicatorLength = 50;
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(LAUNCH_X, LAUNCH_Y);
    ctx.lineTo(
      LAUNCH_X + Math.cos(radians) * indicatorLength,
      LAUNCH_Y - Math.sin(radians) * indicatorLength
    );
    ctx.stroke();

    // Draw target trajectory if shown
    if (showTarget) {
      const targetPoints = calculateTrajectory(currentGoal.velocity, currentGoal.angle);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      targetPoints.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw current trajectory with gradient
    const currentPoints = calculateTrajectory(velocity, angle);
    if (currentPoints.length > 0) {
      // Create gradient for trajectory line
      const trajectoryGradient = ctx.createLinearGradient(
        currentPoints[0].x, currentPoints[0].y,
        currentPoints[currentPoints.length - 1].x, currentPoints[currentPoints.length - 1].y
      );
      
      const isGoodTrajectory = constraintResult.warning.includes('🎯');
      trajectoryGradient.addColorStop(0, isGoodTrajectory ? '#10b981' : '#3b82f6');
      trajectoryGradient.addColorStop(1, isGoodTrajectory ? '#059669' : '#1d4ed8');
      
      ctx.strokeStyle = trajectoryGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      currentPoints.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      // Enhanced trajectory points with size variation
      ctx.fillStyle = isGoodTrajectory ? '#10b981' : '#3b82f6';
      for (let i = 0; i < currentPoints.length; i += 4) {
        const progress = i / currentPoints.length;
        const size = 2 + progress * 3; // Points get larger along trajectory
        ctx.beginPath();
        ctx.arc(currentPoints[i].x, currentPoints[i].y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Enhanced landing point with glow
      const landingPoint = currentPoints[currentPoints.length - 1];
      ctx.fillStyle = isGoodTrajectory ? '#10b981' : '#3b82f6';
      ctx.shadowColor = isGoodTrajectory ? '#10b981' : '#3b82f6';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(landingPoint.x, landingPoint.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw hover ball if launching
    if (isLaunching && currentPoints.length > 0) {
      const currentIndex = Math.floor(animationProgress * (currentPoints.length - 1));
      const currentPoint = currentPoints[currentIndex];
      
      if (currentPoint) {
        // Enhanced ball glow effect
        const glowGradient = ctx.createRadialGradient(
          currentPoint.x, currentPoint.y, 0, 
          currentPoint.x, currentPoint.y, 35
        );
        glowGradient.addColorStop(0, 'rgba(96, 165, 250, 0.9)');
        glowGradient.addColorStop(0.6, 'rgba(96, 165, 250, 0.4)');
        glowGradient.addColorStop(1, 'rgba(96, 165, 250, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, 35, 0, Math.PI * 2);
        ctx.fill();

        // Main ball with metallic effect
        const ballGradient = ctx.createRadialGradient(
          currentPoint.x - 3, currentPoint.y - 3, 0,
          currentPoint.x, currentPoint.y, 12
        );
        ballGradient.addColorStop(0, '#60a5fa');
        ballGradient.addColorStop(0.7, '#3b82f6');
        ballGradient.addColorStop(1, '#1d4ed8');
        
        ctx.fillStyle = ballGradient;
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Enhanced ball shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(currentPoint.x - 4, currentPoint.y - 4, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const launchBall = () => {
    if (isLaunching) return;
    
    setIsLaunching(true);
    setAttempts(prev => prev + 1);
    setAnimationProgress(0);

    // Enhanced accuracy calculation
    const velocityDiff = Math.abs(velocity - currentGoal.velocity);
    const angleDiff = Math.abs(angle - currentGoal.angle);
    
    const maxVelocityDiff = 4;
    const maxAngleDiff = 12;
    
    const velocityScore = Math.max(0, 100 - (velocityDiff / maxVelocityDiff) * 100);
    const angleScore = Math.max(0, 100 - (angleDiff / maxAngleDiff) * 100);
    
    const accuracy = (velocityScore * 0.6 + angleScore * 0.4); // Weight velocity more
    const newScore = Math.round(Math.max(0, Math.min(100, accuracy)));
    
    setScore(newScore);

    // Enhanced animation with physics-based timing
    const trajectory = calculateTrajectory(velocity, angle);
    const duration = Math.min(3000, Math.max(1500, trajectory.length * 20)); // Dynamic duration

    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Enhanced easing for more realistic motion
      const easedProgress = 1 - Math.pow(1 - progress, 1.5);
      setAnimationProgress(easedProgress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsLaunching(false);
        setAnimationProgress(0);
        
        if (newScore >= 85) {
          setShowReward(true);
          if (currentLevel < 3) {
            setTimeout(() => {
              setCurrentLevel(prev => prev + 1);
              setShowReward(false);
            }, 2500);
          } else {
            setTimeout(() => {
              onComplete();
            }, 3000);
          }
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const showTargetTrajectory = () => {
    setShowTarget(true);
    setTimeout(() => setShowTarget(false), 3000);
  };

  const nextLevel = () => {
    if (currentLevel < 3) {
      setCurrentLevel(prev => prev + 1);
      setVelocity(goalConfigs[currentLevel + 1].velocity);
      setAngle(goalConfigs[currentLevel + 1].angle);
    }
  };

  const prevLevel = () => {
    if (currentLevel > 1) {
      setCurrentLevel(prev => prev - 1);
      setVelocity(goalConfigs[currentLevel - 1].velocity);
      setAngle(goalConfigs[currentLevel - 1].angle);
    }
  };

  // Calculate enhanced trajectory data
  const trajectoryData = calculateTrajectory(velocity, angle);
  const range = trajectoryData.length > 0 
    ? ((trajectoryData[trajectoryData.length - 1].x - LAUNCH_X) / CANVAS_SCALE).toFixed(1)
    : '0.0';
  
  const maxHeight = trajectoryData.length > 0
    ? Math.max(...trajectoryData.map(p => (LAUNCH_Y - p.y) / CANVAS_SCALE)).toFixed(1)
    : '0.0';

  const timeOfFlight = ((2 * velocity * Math.sin(angle * Math.PI / 180)) / GRAVITY).toFixed(1);
  const goalDistance = ((currentGoal.left - LAUNCH_X) / CANVAS_SCALE).toFixed(1);

  const constraintResult = checkConstraints();

  return (
    <div className="hover-ball-arena-container">
      <div className="quest-header">
        <button className="back-button" onClick={() => navigate('menu')}>
          ← Back to Arena Map
        </button>
        <h1>⚽ Hover Ball Arena Challenge</h1>
        <p>Master parabolic motion to score perfect goals in the reopened Hover Ball Arena!</p>
        
        <div className="level-indicator">
          <span>Level {currentLevel}/3</span>
          <div className="level-progress">
            <div 
              className="level-progress-fill" 
              style={{width: `${(currentLevel / 3) * 100}%`}}
            ></div>
          </div>
        </div>
      </div>

      <div className="game-stats">
        <div className="stat">
          <span className="stat-label">Attempts</span>
          <span className="stat-value">{attempts}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Best Score</span>
          <span className="stat-value">{score}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Level Target</span>
          <span className="stat-value">{currentGoal.velocity}m/s, {currentGoal.angle}°</span>
        </div>
        <div className="stat">
          <span className="stat-label">Goal Distance</span>
          <span className="stat-value">{goalDistance}m</span>
        </div>
      </div>

      <div className="game-content">
        <div className="controls-panel">
          <div className="level-controls">
            <button onClick={prevLevel} disabled={currentLevel === 1}>
              ← Previous
            </button>
            <span>Level {currentLevel}</span>
            <button onClick={nextLevel} disabled={currentLevel === 3}>
              Next →
            </button>
          </div>

          <div className="control-group">
            <label className="control-label">
              🚀 Launch Velocity: {velocity.toFixed(1)} m/s
            </label>
            <input
              type="range"
              min="15"
              max="35"
              step="0.1"
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              className="control-slider velocity-slider"
              disabled={isLaunching}
            />
            <div className="control-values">
              <span>15 m/s</span>
              <span>35 m/s</span>
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">
              📐 Launch Angle: {angle.toFixed(1)}°
            </label>
            <input
              type="range"
              min="20"
              max="70"
              step="0.5"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="control-slider angle-slider"
              disabled={isLaunching}
            />
            <div className="control-values">
              <span>20°</span>
              <span>70°</span>
            </div>
          </div>

          {constraintResult.warning && (
            <div className={`constraint-feedback ${constraintResult.warning.includes('🎯') ? 'perfect' : 'adjust'}`}>
              <div className="feedback-message">
                {constraintResult.warning}
              </div>
              <button 
                className="tip-button"
                onClick={() => setShowPhysicsTips(!showPhysicsTips)}
              >
                💡 Physics Tip
              </button>
              
              {showPhysicsTips && constraintResult.tip && (
                <div className="physics-tip">
                  {constraintResult.tip}
                </div>
              )}
            </div>
          )}

          <div className="control-buttons">
            <button 
              className="action-button launch-button"
              onClick={launchBall}
              disabled={isLaunching}
            >
              {isLaunching ? '🎯 Launching...' : '⚽ Launch Hover Ball'}
            </button>
            
            <button 
              className="action-button hint-button"
              onClick={showTargetTrajectory}
              disabled={isLaunching || showTarget}
            >
              👁️ Show Target Path
            </button>
          </div>

          <div className="trajectory-data">
            <h4>📊 Current Trajectory Analysis</h4>
            <div className="data-grid">
              <div className="data-item">
                <span>Range:</span>
                <span>{range} m</span>
              </div>
              <div className="data-item">
                <span>Max Height:</span>
                <span>{maxHeight} m</span>
              </div>
              <div className="data-item">
                <span>Time of Flight:</span>
                <span>{timeOfFlight} s</span>
              </div>
              <div className="data-item">
                <span>Goal Distance:</span>
                <span>{goalDistance} m</span>
              </div>
            </div>
          </div>

          <div className="physics-formulas">
            <h4>🔬 Projectile Motion Equations</h4>
            <div className="formula-grid">
              <div className="formula">
                <span>Horizontal Motion:</span>
                <code>x(t) = v₀·cos(θ)·t</code>
              </div>
              <div className="formula">
                <span>Vertical Motion:</span>
                <code>y(t) = v₀·sin(θ)·t - ½·g·t²</code>
              </div>
              <div className="formula">
                <span>Range:</span>
                <code>R = (v₀²·sin(2θ))/g</code>
              </div>
              <div className="formula">
                <span>Max Height:</span>
                <code>h = (v₀²·sin²θ)/(2g)</code>
              </div>
            </div>
          </div>
        </div>

        <div className="arena-container">
          <canvas 
            ref={canvasRef}
            width={800}
            height={600}
            className="hover-arena"
          />
          
          {isLaunching && (
            <div className="launch-overlay">
              <div className="accuracy-display">
                <div className="accuracy-value">{score}% Accuracy</div>
                <div className="physics-data">
                  v₀ = {velocity} m/s, θ = {angle}°, g = {GRAVITY} m/s²
                </div>
                <div className="animation-progress">
                  <div 
                    className="progress-bar"
                    style={{width: `${animationProgress * 100}%`}}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showReward && (
        <div className="reward-overlay">
          <div className="reward-card">
            <div className="reward-icon">🪄</div>
            <h2>Trajectory Vision Unlocked!</h2>
            <p>You've mastered Level {currentLevel} parabolic motion!</p>
            <div className="reward-stats">
              <div className="reward-stat">
                <span>Level Score:</span>
                <strong>{score}%</strong>
              </div>
              <div className="reward-stat">
                <span>Optimal Solution:</span>
                <strong>v₀ = {currentGoal.velocity} m/s, θ = {currentGoal.angle}°</strong>
              </div>
            </div>
            {currentLevel < 3 ? (
              <p className="next-level">Advancing to Level {currentLevel + 1}...</p>
            ) : (
              <p className="completion-message">Arena Mastery Complete! 🏆</p>
            )}
          </div>
        </div>
      )}

      <div className="learning-objectives">
        <h3>🎯 Precision Physics Objectives</h3>
        <div className="objectives-grid">
          <div className="objective">
            <span className="objective-icon">⚡</span>
            <div>
              <strong>Vector Components</strong>
              <p>Decompose velocity into horizontal and vertical components</p>
            </div>
          </div>
          <div className="objective">
            <span className="objective-icon">📐</span>
            <div>
              <strong>Optimal Angles</strong>
              <p>Calculate angles for maximum range and height</p>
            </div>
          </div>
          <div className="objective">
            <span className="objective-icon">🔍</span>
            <div>
              <strong>Trajectory Prediction</strong>
              <p>Predict projectile path using kinematic equations</p>
            </div>
          </div>
          <div className="objective">
            <span className="objective-icon">🎯</span>
            <div>
              <strong>Precision Adjustment</strong>
              <p>Fine-tune parameters for target accuracy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoverBallArena;