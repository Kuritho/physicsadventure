// ============================================
// FILE: src/components/MainMenu.js
// ============================================
import React, { useState } from 'react';
import './MainMenu.css';

const MainMenu = ({ navigate, gameProgress, currentUser, onLogout, onRestartGame }) => {
  const [viewMode, setViewMode] = useState('world-map');
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const worlds = [
  {
    id: 'world1',
    name: 'Motion Valley',
    icon: '🏔️',
    description: 'Master the laws of motion and projectiles',
    continentShape: 'motion-valley-continent',
    mapPosition: { top: '30%', left: '20%' },
    theme: 'mountains',
    color: '#10b981',
    unlocked: true,
    quests: [
      { 
        id: 'quest1', 
        name: 'Slopes of Acceleration', 
        icon: '🎢',
        position: { top: '10%', left: '15%' }
      },
      { 
        id: 'quest2', 
        name: 'Tower of Gravity', 
        icon: '🪂',
        position: { top: '20%', left: '30%' }
      },
      { 
        id: 'quest3', 
        name: 'Rising Orb', 
        icon: '🚀',
        position: { top: '35%', left: '20%' }
      },
      { 
        id: 'quest4', 
        name: 'Archer\'s Challenge', 
        icon: '🏹',
        position: { top: '50%', left: '40%' }
      },
      { 
        id: 'quest5', 
        name: 'Aim for the Stars', 
        icon: '💫',
        position: { top: '25%', left: '55%' }
      },
      { 
        id: 'quest6', 
        name: 'Race of Momentum', 
        icon: '🏁',
        position: { top: '40%', left: '65%' }
      },
      { 
        id: 'quest7', 
        name: 'Skybound Momentum Rally', 
        icon: '🎈',
        position: { top: '60%', left: '25%' }
      },
      { 
        id: 'quest8', 
        name: 'Operation Cushion Impact', 
        icon: '🛡️',
        position: { top: '70%', left: '45%' }
      },
      { 
        id: 'quest9', 
        name: 'Bounce or Break', 
        icon: '💥',
        position: { top: '55%', left: '75%' }
      },
      { 
        id: 'boss', 
        name: 'The Momentum Beast', 
        icon: '🌀',
        position: { top: '80%', left: '60%' }
      }
    ]
  },
    {
      id: 'world2',
      name: 'Force Fortress',
      icon: '🏰',
      description: 'Understand forces and Newton\'s laws',
      continentShape: 'force-fortress-continent',
      mapPosition: { top: '25%', left: '75%' },
      theme: 'fortress',
      color: '#ef4444',
      unlocked: false,
      quests: []
    },
    {
      id: 'world3',
      name: 'Energy Empire',
      icon: '⚡',
      description: 'Harness the power of energy',
      continentShape: 'energy-empire-continent',
      mapPosition: { top: '70%', left: '25%' },
      theme: 'energy',
      color: '#f59e0b',
      unlocked: false,
      quests: []
    },
    {
      id: 'world4',
      name: 'Quantum Realm',
      icon: '🌌',
      description: 'Explore the mysteries of quantum physics',
      continentShape: 'quantum-realm-continent',
      mapPosition: { top: '70%', left: '75%' },
      theme: 'quantum',
      color: '#8b5cf6',
      unlocked: false,
      quests: []
    }
  ];

  const isQuestUnlocked = (worldId, questIndex) => {
    if (questIndex === 0) return true;
    const world = worlds.find(w => w.id === worldId);
    const prevQuestId = world.quests[questIndex - 1].id;
    return gameProgress[worldId][prevQuestId] === true;
  };

  const isWorldComplete = (worldId) => {
    return gameProgress[worldId].boss === true;
  };

  const canAccessWorld = (worldId) => {
    const worldIndex = worlds.findIndex(w => w.id === worldId);
    if (worldIndex === 0) return true;
    const prevWorld = worlds[worldIndex - 1];
    return isWorldComplete(prevWorld.id);
  };

  const handleWorldClick = (world) => {
    if (canAccessWorld(world.id)) {
      setSelectedWorld(world.id);
      setViewMode('quest-map');
    }
  };

  const handleBackToWorldMap = () => {
    setViewMode('world-map');
    setSelectedWorld(null);
  };

  // World Map View
  if (viewMode === 'world-map') {
    return (
      <div className="game-map world-overview">
        {/* User Info Panel */}
        <div className="user-info-panel">
          <button 
            className="user-profile-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <span className="user-icon">👤</span>
            <span className="user-name">{currentUser?.username || 'Player'}</span>
            <span className="dropdown-arrow">{showUserMenu ? '▲' : '▼'}</span>
          </button>
          
          {showUserMenu && (
            <div className="user-dropdown-menu">
              <div className="user-info">
                <p className="user-detail">
                  <span className="detail-icon">👤</span>
                  {currentUser?.username}
                </p>
                <p className="user-detail">
                  <span className="detail-icon">📧</span>
                  {currentUser?.email}
                </p>
              </div>
              <div className="user-actions">
                <button onClick={onRestartGame} className="restart-btn">
                  🔄 Restart Game
                </button>
                <button onClick={onLogout} className="logout-btn">
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="map-header-bar">
          <h1 className="world-map-title">🌍 Physics Quest - World Map 🌍</h1>
          <p className="world-map-subtitle">Explore the continents of physics and conquer each realm!</p>
        </div>

        <div className="world-map-container">
          {/* Animated ocean background */}
          <div className="ocean-background">
            <div className="ocean-wave wave1"></div>
            <div className="ocean-wave wave2"></div>
            <div className="ocean-wave wave3"></div>
          </div>

          {/* Grid lines for map effect */}
          <svg className="map-grid" width="100%" height="100%">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Continent landmasses */}
          {worlds.map((world, index) => {
            const accessible = canAccessWorld(world.id);
            const completed = isWorldComplete(world.id);

            return (
              <div
                key={world.id}
                className={`continent ${world.continentShape} ${!accessible ? 'continent-locked' : ''} ${completed ? 'continent-completed' : ''}`}
                style={{
                  top: world.mapPosition.top,
                  left: world.mapPosition.left
                }}
                onClick={() => handleWorldClick(world)}
              >
                {/* Continent SVG shape */}
                <svg className="continent-svg" viewBox="0 0 300 250" preserveAspectRatio="none">
                  <defs>
                    <filter id={`shadow-${world.id}`}>
                      <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.5"/>
                    </filter>
                    <linearGradient id={`gradient-${world.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{stopColor: accessible ? world.color : '#4b5563', stopOpacity: 1}} />
                      <stop offset="100%" style={{stopColor: accessible ? (completed ? '#059669' : world.color) : '#374151', stopOpacity: 0.8}} />
                    </linearGradient>
                  </defs>
                  
                  {/* Different shapes for each continent */}
                  {world.id === 'world1' && (
                    <path 
                      d="M 50 80 Q 70 40, 120 30 T 200 50 Q 250 70, 260 120 T 240 180 Q 200 220, 150 210 T 80 180 Q 40 150, 50 80 Z" 
                      fill={`url(#gradient-${world.id})`}
                      filter={`url(#shadow-${world.id})`}
                      className="continent-path"
                    />
                  )}
                  {world.id === 'world2' && (
                    <path 
                      d="M 100 40 L 180 30 Q 230 50, 250 100 L 270 150 Q 260 190, 220 210 L 150 220 Q 100 200, 80 160 L 60 100 Q 70 60, 100 40 Z" 
                      fill={`url(#gradient-${world.id})`}
                      filter={`url(#shadow-${world.id})`}
                      className="continent-path"
                    />
                  )}
                  {world.id === 'world3' && (
                    <path 
                      d="M 80 60 Q 120 30, 180 40 T 240 80 L 260 130 Q 250 180, 200 210 T 120 220 Q 70 200, 50 150 L 40 100 Q 50 70, 80 60 Z" 
                      fill={`url(#gradient-${world.id})`}
                      filter={`url(#shadow-${world.id})`}
                      className="continent-path"
                    />
                  )}
                  {world.id === 'world4' && (
                    <path 
                      d="M 60 90 L 90 50 Q 140 30, 190 50 L 240 80 Q 270 120, 260 170 L 230 210 Q 180 230, 130 220 L 80 200 Q 50 160, 40 120 L 60 90 Z" 
                      fill={`url(#gradient-${world.id})`}
                      filter={`url(#shadow-${world.id})`}
                      className="continent-path"
                    />
                  )}
                  
                  {/* Mountain/terrain details */}
                  {accessible && (
                    <g className="continent-details" opacity="0.3">
                      <circle cx="150" cy="100" r="15" fill="rgba(255,255,255,0.3)" />
                      <circle cx="120" cy="130" r="10" fill="rgba(255,255,255,0.2)" />
                      <circle cx="180" cy="120" r="12" fill="rgba(255,255,255,0.25)" />
                    </g>
                  )}
                </svg>

                {/* World icon and label */}
                <div className="continent-label">
                  <div className="continent-icon">
                    {world.icon}
                    {!accessible && <div className="continent-lock-overlay">🔒</div>}
                    {completed && <div className="continent-complete-badge">✓</div>}
                  </div>
                  <div className="continent-name">{world.name}</div>
                  <div className="continent-description">{world.description}</div>
                  {accessible && (
                    <div className="continent-progress">
                      <div className="progress-label">Progress</div>
                      <div className="continent-progress-bar">
                        <div 
                          className="continent-progress-fill"
                          style={{
                            width: `${(Object.values(gameProgress[world.id]).filter(Boolean).length / 10) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        {Object.values(gameProgress[world.id]).filter(Boolean).length}/10 Quests
                      </div>
                    </div>
                  )}
                  {!accessible && (
                    <div className="locked-message">Coming Soon!</div> 
                    // <div className="locked-message">Complete previous world to unlock</div> 
                  )}
                </div>

                {/* Pulsing effect for accessible continents */}
                {accessible && !completed && (
                  <div className="continent-pulse"></div>
                )}
              </div>
            );
          })}

          {/* Decorative elements */}
          <div className="map-decorations">
            <div className="compass-rose">
              <div className="compass-rose-inner">
                <div className="compass-point north">N</div>
                <div className="compass-point south">S</div>
                <div className="compass-point east">E</div>
                <div className="compass-point west">W</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quest Map View
  const currentWorld = worlds.find(w => w.id === selectedWorld);

  return (
    <div className="game-map quest-view">
      <div className="map-header-bar">
        <button className="back-to-worlds-btn" onClick={handleBackToWorldMap}>
          ← Back to World Map
        </button>
        <div className="current-world-header">
          <span className="header-world-icon">{currentWorld.icon}</span>
          <span className="header-world-name">{currentWorld.name}</span>
        </div>
      </div>

      <div className="map-landscape">
        {/* Background scenery */}
        <div className="landscape-bg">
          <div className="sky-gradient"></div>
          <div className="mountains"></div>
          <div className="hills"></div>
          <div className="river"></div>
          <div className="ground"></div>
        </div>

        {/* Quest nodes positioned on the landscape */}
        <div className="quest-nodes-container">
          {currentWorld.quests.map((quest, index) => {
            const unlocked = isQuestUnlocked(selectedWorld, index);
            const completed = gameProgress[selectedWorld][quest.id];
            const isBoss = quest.id === 'boss';

            const nextQuest = currentWorld.quests[index + 1];
            const lineColor = completed ? '#10b981' : unlocked ? '#60a5fa' : '#6b7280';

            return (
              <React.Fragment key={quest.id}>
                {nextQuest && (
                  <svg className="connection-line" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    <line
                      x1={quest.position.left}
                      y1={quest.position.top}
                      x2={nextQuest.position.left}
                      y2={nextQuest.position.top}
                      stroke={lineColor}
                      strokeWidth="4"
                      strokeDasharray={completed ? '0' : '10,5'}
                    />
                  </svg>
                )}

                <div
                  className={`quest-marker ${isBoss ? 'boss-marker' : ''} ${!unlocked ? 'locked-marker' : ''} ${completed ? 'completed-marker' : ''}`}
                  style={{
                    top: quest.position.top,
                    left: quest.position.left
                  }}
                  onClick={() => {
                    if (unlocked) {
                      navigate(`${selectedWorld}-${quest.id}`);
                    }
                  }}
                >
                  <div className="marker-glow"></div>
                  <div className="marker-platform">
                    <div className="platform-base"></div>
                    <div className="marker-icon">{quest.icon}</div>
                    {!unlocked && <div className="marker-lock">🔒</div>}
                    {completed && <div className="marker-check">✓</div>}
                  </div>
                  <div className="marker-label">
                    <span className="label-text">{quest.name}</span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="world-title-overlay">
          <div className="world-title-badge">
            <span className="world-title-icon">{currentWorld.icon}</span>
            <span className="world-title-text">{currentWorld.name.toUpperCase()}</span>
          </div>
        </div>

        <div className="compass-widget">
          <div className="compass-circle">
            <div className="compass-needle"></div>
            <div className="compass-directions">
              <span className="compass-n">N</span>
              <span className="compass-s">S</span>
              <span className="compass-e">E</span>
              <span className="compass-w">W</span>
            </div>
          </div>
        </div>

        <div className="progress-widget">
          <div className="progress-header">Progress</div>
          <div className="progress-stats">
            <div className="stat-item">
              <span className="stat-icon">🎯</span>
              <span className="stat-value">
                {Object.values(gameProgress[selectedWorld]).filter(Boolean).length}/10
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;