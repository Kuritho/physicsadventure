// ============================================
// FILE: src/worlds/World1/TheMomentumBeast.js
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import './TheMomentumBeast.css';

const TheMomentumBeast = ({ onComplete, navigate }) => {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [bossHealth, setBossHealth] = useState(100);
  const [gameStatus, setGameStatus] = useState('playing');
  const [currentProblem, setCurrentProblem] = useState(null);
  const [playerAnswer, setPlayerAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [simulationState, setSimulationState] = useState('idle'); // idle, running, completed
  const [simulationData, setSimulationData] = useState(null);

  const arenaRef = useRef(null);
  const bossRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const simulationRef = useRef(null);

  // Enhanced Physics Problems with Simulation Parameters
  const phase1Problems = [
    {
      id: 1,
      type: 'projectile',
      question: 'The beast launches a fireball at 20 m/s, 30° above horizontal. Calculate maximum height (g=10 m/s²):',
      answer: '5',
      explanation: 'Using h = (v²sin²θ)/(2g) = (400×0.25)/(20) = 5m',
      simulation: {
        type: 'projectile',
        velocity: 20,
        angle: 30,
        gravity: 10,
        expectedHeight: 5,
        expectedRange: 34.64
      }
    },
    {
      id: 2,
      type: 'projectile',
      question: 'A meteor is thrown at 15 m/s, 45° angle. Calculate range (g=10 m/s²):',
      answer: '22.5',
      explanation: 'Range = (v²sin2θ)/g = (225×1)/10 = 22.5m',
      simulation: {
        type: 'projectile',
        velocity: 15,
        angle: 45,
        gravity: 10,
        expectedHeight: 5.625,
        expectedRange: 22.5
      }
    },
    {
      id: 3,
      type: 'projectile',
      question: 'The beast shoots a spike with horizontal velocity 12 m/s from 20m height. Time to hit ground?',
      answer: '2',
      explanation: 'Vertical motion: h = ½gt² → 20 = 5t² → t=2s',
      simulation: {
        type: 'horizontalThrow',
        velocity: 12,
        height: 20,
        gravity: 10,
        expectedTime: 2,
        expectedRange: 24
      }
    }
  ];

  const phase2Problems = [
    {
      id: 1,
      type: 'impulse',
      question: 'A 50kg boulder hits your shield at 8 m/s. You have 0.4s to stop it. What force is needed?',
      answer: '1000',
      explanation: 'F = mΔv/Δt = (50×8)/0.4 = 1000N',
      simulation: {
        type: 'impulse',
        mass: 50,
        initialVelocity: 8,
        timeToStop: 0.4,
        requiredForce: 1000,
        distance: 1.6
      }
    },
    {
      id: 2,
      type: 'impulse',
      question: 'The beast throws a 10kg rock. You apply 500N for 0.2s. What velocity change?',
      answer: '10',
      explanation: 'Δv = FΔt/m = (500×0.2)/10 = 10 m/s',
      simulation: {
        type: 'forceApplication',
        mass: 10,
        force: 500,
        time: 0.2,
        velocityChange: 10,
        distance: 0.1
      }
    },
    {
      id: 3,
      type: 'impulse',
      question: 'A 30kg projectile at 15 m/s stops in 0.1s. Calculate impulse:',
      answer: '450',
      explanation: 'J = mΔv = 30×15 = 450 N·s',
      simulation: {
        type: 'impulseCollision',
        mass: 30,
        initialVelocity: 15,
        stoppingTime: 0.1,
        impulse: 450,
        averageForce: 4500
      }
    }
  ];

  const phase3Problems = [
    {
      id: 1,
      type: 'momentum',
      question: '100kg beast at 6 m/s hits your 50kg shield at rest. If they stick, find final velocity:',
      answer: '4',
      explanation: 'm1v1 + m2v2 = (m1+m2)vf → 600 + 0 = 150vf → vf=4 m/s',
      simulation: {
        type: 'inelasticCollision',
        mass1: 100,
        velocity1: 6,
        mass2: 50,
        velocity2: 0,
        finalVelocity: 4,
        kineticEnergyLost: 600
      }
    },
    {
      id: 2,
      type: 'momentum',
      question: '80kg beast running 5 m/s jumps on your 20kg cart at rest. Find combined speed:',
      answer: '4',
      explanation: '80×5 + 20×0 = (80+20)vf → 400 = 100vf → vf=4 m/s',
      simulation: {
        type: 'inelasticCollision',
        mass1: 80,
        velocity1: 5,
        mass2: 20,
        velocity2: 0,
        finalVelocity: 4,
        kineticEnergyLost: 400
      }
    },
    {
      id: 3,
      type: 'momentum',
      question: 'Two 60kg beasts collide. One at 8 m/s, other at 2 m/s opposite. If elastic, find rebound velocities:',
      answer: '2,8',
      explanation: 'Perfect elastic: velocities exchange → 2 m/s and 8 m/s',
      simulation: {
        type: 'elasticCollision',
        mass1: 60,
        velocity1: 8,
        mass2: 60,
        velocity2: -2,
        finalVelocity1: -2,
        finalVelocity2: 8,
        kineticEnergyConserved: true
      }
    }
  ];

  // Initialize game
  useEffect(() => {
    startPhase(currentPhase);
    startTimer();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeOut();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeOut = () => {
    setPlayerHealth(prev => Math.max(0, prev - 20));
    setFeedback('⏰ Time out! The beast attacks! -20 HP');
    runSimulation('timeOutAttack');
    generateNewProblem();
  };

  const startPhase = (phase) => {
    setCurrentPhase(phase);
    setTimeLeft(30);
    setFeedback('');
    setPlayerAnswer('');
    setSimulationState('idle');
    setSimulationData(null);
    generateNewProblem();
    
    if (bossRef.current) {
      bossRef.current.className = `momentum-beast phase-${phase}`;
    }
  };

  const generateNewProblem = () => {
    let problems;
    switch (currentPhase) {
      case 1: problems = phase1Problems; break;
      case 2: problems = phase2Problems; break;
      case 3: problems = phase3Problems; break;
      default: problems = phase1Problems;
    }
    
    const randomProblem = problems[Math.floor(Math.random() * problems.length)];
    setCurrentProblem(randomProblem);
    setPlayerAnswer('');
    setFeedback('');
    setTimeLeft(30);
    setSimulationState('idle');
    setSimulationData(null);
  };

  const runSimulation = (type, data = null) => {
    setSimulationState('running');
    
    if (type === 'correctAnswer' && currentProblem) {
      setSimulationData(currentProblem.simulation);
      
      // Simulate different physics based on phase and problem type
      setTimeout(() => {
        setSimulationState('completed');
      }, 3000);
    } else if (type === 'timeOutAttack') {
      // Beast attacks when time runs out
      setSimulationData({ type: 'beastAttack', damage: 20 });
      setTimeout(() => {
        setSimulationState('completed');
      }, 2000);
    }
  };

  const checkAnswer = () => {
    if (!currentProblem || !playerAnswer.trim()) return;

    const correctAnswers = currentProblem.answer.split(',');
    const playerAnswers = playerAnswer.split(',').map(a => a.trim());
    
    let isCorrect = false;
    
    if (correctAnswers.length === 1) {
      isCorrect = Math.abs(parseFloat(playerAnswers[0]) - parseFloat(correctAnswers[0])) < 0.1;
    } else {
      isCorrect = playerAnswers.length === correctAnswers.length &&
                 playerAnswers.every((ans, index) => 
                   Math.abs(parseFloat(ans) - parseFloat(correctAnswers[index])) < 0.1
                 );
    }

    if (isCorrect) {
      setScore(prev => prev + 10);
      setBossHealth(prev => Math.max(0, prev - 25));
      setFeedback(`✅ Correct! ${currentProblem.explanation}`);
      
      // Run simulation for correct answer
      runSimulation('correctAnswer');
      
      // Boss damage animation
      if (bossRef.current) {
        bossRef.current.classList.add('taking-damage');
        setTimeout(() => {
          if (bossRef.current) {
            bossRef.current.classList.remove('taking-damage');
          }
        }, 500);
      }
      
      setTimeout(() => {
        if (bossHealth <= 25) {
          if (currentPhase < 3) {
            setCurrentPhase(prev => prev + 1);
            startPhase(currentPhase + 1);
          } else {
            setGameStatus('win');
            if (timerRef.current) clearInterval(timerRef.current);
          }
        } else {
          generateNewProblem();
        }
      }, 4000);
    } else {
      setPlayerHealth(prev => Math.max(0, prev - 15));
      setFeedback('❌ Incorrect! The beast counterattacks! -15 HP');
      runSimulation('counterAttack');
      
      // Player damage animation
      if (playerRef.current) {
        playerRef.current.classList.add('taking-damage');
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.classList.remove('taking-damage');
          }
        }, 500);
      }
      
      setTimeout(() => {
        generateNewProblem();
      }, 3000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  };

  // Game over conditions
  useEffect(() => {
    if (playerHealth <= 0) {
      setGameStatus('lose');
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (bossHealth <= 0 && currentPhase === 3) {
      setGameStatus('win');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [playerHealth, bossHealth, currentPhase]);

  const restartGame = () => {
    setCurrentPhase(1);
    setPlayerHealth(100);
    setBossHealth(100);
    setGameStatus('playing');
    setScore(0);
    setTimeLeft(30);
    setSimulationState('idle');
    setSimulationData(null);
    startPhase(1);
    startTimer();
  };

  const completeQuest = () => {
    onComplete();
  };

  // Render Simulation based on current phase and type
  const renderSimulation = () => {
    if (simulationState !== 'running' || !simulationData) return null;

    switch (simulationData.type) {
      case 'projectile':
        return (
          <div className="simulation-container projectile-simulation">
            <div className="simulation-title">🚀 Projectile Motion Simulation</div>
            <div className="projectile-canvas">
              <div className="ground-line"></div>
              <div className="projectile-object"></div>
              <div className="trajectory-line"></div>
              <div className="height-marker">Max Height: {simulationData.expectedHeight}m</div>
              <div className="range-marker">Range: {simulationData.expectedRange}m</div>
            </div>
            <div className="simulation-data">
              <div>Initial Velocity: {simulationData.velocity} m/s</div>
              <div>Launch Angle: {simulationData.angle}°</div>
              <div>Gravity: {simulationData.gravity} m/s²</div>
            </div>
          </div>
        );

      case 'horizontalThrow':
        return (
          <div className="simulation-container horizontal-throw-simulation">
            <div className="simulation-title">🎯 Horizontal Throw Simulation</div>
            <div className="throw-canvas">
              <div className="cliff-edge"></div>
              <div className="falling-object"></div>
              <div className="parabolic-path"></div>
              <div className="time-display">Time: {simulationData.expectedTime}s</div>
              <div className="range-display">Range: {simulationData.expectedRange}m</div>
            </div>
            <div className="simulation-data">
              <div>Horizontal Velocity: {simulationData.velocity} m/s</div>
              <div>Initial Height: {simulationData.height}m</div>
              <div>Gravity: {simulationData.gravity} m/s²</div>
            </div>
          </div>
        );

      case 'impulse':
        return (
          <div className="simulation-container impulse-simulation">
            <div className="simulation-title">💥 Impulse Simulation</div>
            <div className="impulse-canvas">
              <div className="boulder-object"></div>
              <div className="shield-object"></div>
              <div className="force-arrow"></div>
              <div className="deformation-effect"></div>
              <div className="impulse-data">
                <div>Force: {simulationData.requiredForce}N</div>
                <div>Time: {simulationData.timeToStop}s</div>
                <div>Distance: {simulationData.distance}m</div>
              </div>
            </div>
          </div>
        );

      case 'forceApplication':
        return (
          <div className="simulation-container force-simulation">
            <div className="simulation-title">⚡ Force Application Simulation</div>
            <div className="force-canvas">
              <div className="rock-object"></div>
              <div className="force-application"></div>
              <div className="velocity-change">Δv: +{simulationData.velocityChange} m/s</div>
              <div className="acceleration-display">
                Acceleration: {simulationData.force / simulationData.mass} m/s²
              </div>
            </div>
          </div>
        );

      case 'inelasticCollision':
        return (
          <div className="simulation-container collision-simulation">
            <div className="simulation-title">🔄 Inelastic Collision Simulation</div>
            <div className="collision-canvas">
              <div className="object-beast"></div>
              <div className="object-shield"></div>
              <div className="collision-moment"></div>
              <div className="combined-object"></div>
              <div className="momentum-data">
                <div>Final Velocity: {simulationData.finalVelocity} m/s</div>
                <div>Energy Lost: {simulationData.kineticEnergyLost}J</div>
              </div>
            </div>
          </div>
        );

      case 'elasticCollision':
        return (
          <div className="simulation-container elastic-simulation">
            <div className="simulation-title">⚡ Elastic Collision Simulation</div>
            <div className="elastic-canvas">
              <div className="beast-1"></div>
              <div className="beast-2"></div>
              <div className="collision-point"></div>
              <div className="rebound-1"></div>
              <div className="rebound-2"></div>
              <div className="velocity-display">
                <div>Before: {simulationData.velocity1} m/s & {simulationData.velocity2} m/s</div>
                <div>After: {simulationData.finalVelocity1} m/s & {simulationData.finalVelocity2} m/s</div>
              </div>
            </div>
          </div>
        );

      case 'beastAttack':
        return (
          <div className="simulation-container attack-simulation">
            <div className="simulation-title">💀 Beast Attack!</div>
            <div className="attack-canvas">
              <div className="attack-wave"></div>
              <div className="damage-indicator">-{simulationData.damage} HP</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Game Over Screens
  if (gameStatus === 'win') {
    return (
      <div className="momentum-beast-game victory-screen">
        <div className="victory-content">
          <div className="victory-icon">🎉</div>
          <h1>VICTORY!</h1>
          <div className="victory-message">
            You've mastered physics simulations and defeated the Momentum Beast!
          </div>
          <div className="final-stats">
            <div className="stat">Final Score: <strong>{score}</strong></div>
            <div className="stat">Health Remaining: <strong>{playerHealth}%</strong></div>
          </div>
          <div className="victory-reward">
            <div className="crystal">💎</div>
            <div className="reward-text">Physics Simulator Master Unlocked!</div>
          </div>
          <button className="continue-btn" onClick={completeQuest}>
            🏆 Continue Journey
          </button>
        </div>
      </div>
    );
  }

  if (gameStatus === 'lose') {
    return (
      <div className="momentum-beast-game defeat-screen">
        <div className="defeat-content">
          <div className="defeat-icon">💀</div>
          <h1>DEFEATED</h1>
          <div className="defeat-message">
            The Momentum Beast overwhelmed your calculations!
          </div>
          <div className="final-stats">
            <div className="stat">Final Score: <strong>{score}</strong></div>
            <div className="stat">Boss Health: <strong>{bossHealth}%</strong></div>
          </div>
          <div className="defeat-actions">
            <button className="retry-btn" onClick={restartGame}>
              🔄 Try Again
            </button>
            <button className="retreat-btn" onClick={() => navigate('menu')}>
              🏠 Main Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="momentum-beast-game">
      {/* Header */}
      <div className="game-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('menu')}>
            ← Menu
          </button>
          <div className="game-title">
            <h1>🌀 Momentum Beast</h1>
            <div className="phase-badge">Phase {currentPhase}</div>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">Score</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Time</span>
            <span className="stat-value">{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="battle-arena" ref={arenaRef}>
        {/* Boss */}
        <div className="combatant boss-combatant">
          <div ref={bossRef} className="momentum-beast phase-1">
            <div className="health-container">
              <div className="health-bar">
                <div 
                  className="health-fill boss-health"
                  style={{ width: `${bossHealth}%` }}
                ></div>
              </div>
              <div className="health-text">Beast: {bossHealth}%</div>
            </div>
            <div className="character-model">
              <div className="beast-body">🌀</div>
            </div>
          </div>
        </div>

        {/* Simulation Area */}
        <div className="simulation-zone">
          {simulationState === 'running' ? (
            renderSimulation()
          ) : (
            <div className="simulation-placeholder">
              <div className="placeholder-icon">
                {currentPhase === 1 && '🚀'}
                {currentPhase === 2 && '💥'}
                {currentPhase === 3 && '⚡'}
              </div>
              <div className="placeholder-text">
                Solve the problem to see physics in action!
              </div>
            </div>
          )}
        </div>

        {/* Player */}
        <div className="combatant player-combatant">
          <div ref={playerRef} className="player-character">
            <div className="health-container">
              <div className="health-bar">
                <div 
                  className="health-fill player-health"
                  style={{ width: `${playerHealth}%` }}
                ></div>
              </div>
              <div className="health-text">You: {playerHealth}%</div>
            </div>
            <div className="character-model">
              <div className="player-body">🛡️</div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Interface */}
      <div className="game-interface">
        {/* Phase Progress */}
        <div className="phase-tracker">
          <div className="phase-steps">
            {[1, 2, 3].map(phase => (
              <div key={phase} className="phase-step">
                <div className={`phase-marker ${currentPhase >= phase ? 'active' : ''}`}>
                  {phase}
                </div>
                <div className="phase-label">
                  {phase === 1 && 'Projectile'}
                  {phase === 2 && 'Impulse'}
                  {phase === 3 && 'Momentum'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Problem Section */}
        <div className="problem-section">
          <div className="problem-header">
            <h3>Physics Challenge</h3>
            <div className="time-remaining">⏱️ {timeLeft}s</div>
          </div>
          
          {currentProblem && (
            <div className="problem-card">
              <div className="problem-text">
                {currentProblem.question}
              </div>
              
              <div className="answer-section">
                <input
                  type="text"
                  value={playerAnswer}
                  onChange={(e) => setPlayerAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    currentProblem.type === 'momentum' 
                      ? 'Enter comma-separated values (e.g., 4,8)' 
                      : 'Enter numerical answer...'
                  }
                  disabled={feedback.includes('✅') || feedback.includes('❌')}
                  className="answer-input"
                />
                <button 
                  onClick={checkAnswer}
                  disabled={!playerAnswer.trim() || feedback.includes('✅') || feedback.includes('❌')}
                  className="submit-btn"
                >
                  🎯 Submit Answer
                </button>
              </div>

              {feedback && (
                <div className={`feedback-message ${feedback.includes('✅') ? 'success' : 'error'}`}>
                  {feedback}
                </div>
              )}
            </div>
          )}

          {/* Physics Reference */}
          <div className="physics-reference">
            <div className="reference-title">📚 Physics Formulas</div>
            <div className="reference-content">
              {currentPhase === 1 && (
                <>
                  <div>• Max Height: h = (v²sin²θ)/(2g)</div>
                  <div>• Range: R = (v²sin2θ)/g</div>
                  <div>• Time: t = √(2h/g)</div>
                </>
              )}
              {currentPhase === 2 && (
                <>
                  <div>• Impulse: J = F·Δt = m·Δv</div>
                  <div>• Force: F = m·Δv/Δt</div>
                  <div>• Momentum: p = m·v</div>
                </>
              )}
              {currentPhase === 3 && (
                <>
                  <div>• Conservation: m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'</div>
                  <div>• Elastic: KE conserved</div>
                  <div>• Inelastic: objects combine</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="action-bar">
          <button onClick={restartGame} className="action-btn restart">
            🔄 Restart Battle
          </button>
          <div className="game-tip">
            💡 Tip: Watch the simulation to understand the physics!
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheMomentumBeast;