import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ALL_POTS, INITIAL_GROUPS, TOTAL_GROUPS, POT_1 } from './constants';
import { Group, Team } from './types';
import GroupCard from './components/GroupCard';
import DrawStage from './components/DrawStage';
import { analyzeFullDraw } from './services/geminiService';
import { Share2, Play, FastForward, RefreshCw, MessageSquare, Zap } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [groups, setGroups] = useState<Group[]>(JSON.parse(JSON.stringify(INITIAL_GROUPS)));
  const [potIndex, setPotIndex] = useState(0);
  const [currentAvailableTeams, setCurrentAvailableTeams] = useState<Team[]>([]);
  const [drawnTeam, setDrawnTeam] = useState<Team | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [fullAnalysis, setFullAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [lastAssignedGroupIndex, setLastAssignedGroupIndex] = useState<number | null>(null);

  // Refs for intervals
  const autoInterval = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Logic to initialize the draw with hosts
  const initializeDraw = useCallback(() => {
    const newGroups: Group[] = JSON.parse(JSON.stringify(INITIAL_GROUPS));
    
    // Pre-assign Hosts to A1, B1, D1
    const mexico = POT_1.find(t => t.name.includes('Mexico'));
    const canada = POT_1.find(t => t.name.includes('Canada'));
    const usa = POT_1.find(t => t.name.includes('USA'));

    if (mexico) newGroups[0].teams.push(mexico); // Group A
    if (canada) newGroups[1].teams.push(canada); // Group B
    if (usa) newGroups[3].teams.push(usa);    // Group D

    setGroups(newGroups);
    setPotIndex(0);
    setIsFinished(false);
    setDrawnTeam(null);
    setFullAnalysis(null);
    setIsAuto(false);
    setLastAssignedGroupIndex(null);
  }, []);

  // Initialization from URL parameter or Default
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const drawId = urlParams.get('id');

    if (drawId) {
      // Fetch draw from API
      fetch(`/api/get-draw?id=${drawId}`)
        .then(res => res.json())
        .then(data => {
          if (data.drawData && Array.isArray(data.drawData) && data.drawData.length === 12) {
            setGroups(data.drawData);
            setIsFinished(true);
            setPotIndex(4); // Past end
          } else {
            console.error("Invalid draw data");
            initializeDraw();
          }
        })
        .catch(err => {
          console.error("Failed to fetch draw:", err);
          initializeDraw();
        });
    } else {
      // Check for legacy hash format
      const hash = window.location.hash.slice(1);
      if (hash) {
        try {
          const decoded = JSON.parse(atob(hash));
          if (Array.isArray(decoded) && decoded.length === 12) {
            setGroups(decoded);
            setIsFinished(true);
            setPotIndex(4); // Past end
            return;
          }
        } catch (e) {
          console.error("Invalid hash", e);
        }
      }
      // Start fresh if no id or hash
      initializeDraw();
    }
  }, [initializeDraw]);

  // Update available teams when pot changes or draw happens
  useEffect(() => {
    if (potIndex < 4 && !isFinished) {
       // Filter out teams already in groups from this pot
       const teamsInGroups = new Set(groups.flatMap(g => g.teams.map(t => t.id)));
       const remaining = ALL_POTS[potIndex].filter(t => !teamsInGroups.has(t.id));
       setCurrentAvailableTeams(remaining);
    }
  }, [potIndex, groups, isFinished]);

  // Helper to check if the draw is complete
  useEffect(() => {
    if (potIndex === 4) {
      setIsFinished(true);
      setIsAuto(false);
      if (autoInterval.current) clearInterval(autoInterval.current);

      // Validate the final draw
      const validation = validateFinalDraw();
      if (!validation.valid) {
        console.error("Draw validation failed:", validation.errors);
        validation.errors.forEach(err => console.error(err));
      } else {
        console.log("✓ Draw validation passed - all constraints satisfied");
      }
    }
  }, [potIndex, groups]);

  const drawNextTeam = useCallback(() => {
    if (isAnimating || isFinished || potIndex >= 4) return;
    if (currentAvailableTeams.length === 0) {
        // Move to next pot if current is empty but potIndex didn't update
        setPotIndex(prev => prev + 1);
        return;
    }

    setIsAnimating(true);

    // Smart placement algorithm: Find most constrained group first
    const groupIndices = getGroupsNeedingTeam();

    if (groupIndices.length === 0) {
      console.error("No groups need teams but we still have teams to draw");
      setIsAnimating(false);
      return;
    }

    // For each group, calculate how many valid teams can be placed there
    const groupConstraints = groupIndices.map(groupIndex => {
      const validTeams = getValidTeamsForGroup(groups[groupIndex], currentAvailableTeams);
      return {
        groupIndex,
        validTeams,
        constraintLevel: validTeams.length
      };
    });

    // Sort by constraint level (fewest options first = most constrained)
    groupConstraints.sort((a, b) => a.constraintLevel - b.constraintLevel);

    // Pick the most constrained group
    const mostConstrained = groupConstraints[0];

    if (mostConstrained.validTeams.length === 0) {
      console.error("Dead-end: No valid teams for group", mostConstrained.groupIndex);
      // Fallback: pick any team and group (should not happen with proper algorithm)
      const randomTeam = currentAvailableTeams[Math.floor(Math.random() * currentAvailableTeams.length)];
      setDrawnTeam(randomTeam);
      setLastAssignedGroupIndex(mostConstrained.groupIndex);
      return;
    }

    // Randomly select from valid teams for this group
    const randomIndex = Math.floor(Math.random() * mostConstrained.validTeams.length);
    const selectedTeam = mostConstrained.validTeams[randomIndex];

    setDrawnTeam(selectedTeam);
    setLastAssignedGroupIndex(mostConstrained.groupIndex);
    // Logic continues in handleAnimationComplete
  }, [isAnimating, isFinished, potIndex, currentAvailableTeams, groups]);

  // Check if placement is valid based on confederation rules
  const isValidPlacement = (group: Group, team: Team): boolean => {
    const existingConfeds = group.teams.map(t => t.confederation);

    if (team.confederation === 'UEFA') {
      // Max 2 UEFA teams per group
      const uefaCount = existingConfeds.filter(c => c === 'UEFA').length;
      return uefaCount < 2;
    } else {
      // Max 1 from same non-UEFA confederation per group
      return !existingConfeds.includes(team.confederation);
    }
  };

  // Smart placement: Find which teams can go into which groups
  const getValidTeamsForGroup = (group: Group, availableTeams: Team[]): Team[] => {
    return availableTeams.filter(team => isValidPlacement(group, team));
  };

  // Get all groups that need a team from current pot
  const getGroupsNeedingTeam = (): number[] => {
    return groups
      .map((group, index) => ({ group, index }))
      .filter(({ group }) => group.teams.length === potIndex)
      .map(({ index }) => index);
  };

  // Validate final draw meets all FIFA requirements
  const validateFinalDraw = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    groups.forEach((group, idx) => {
      const confederations = group.teams.map(t => t.confederation);
      const uefaCount = confederations.filter(c => c === 'UEFA').length;

      // Check UEFA constraints: 1-2 per group
      if (uefaCount < 1) {
        errors.push(`Group ${group.name}: No UEFA team (requires at least 1)`);
      }
      if (uefaCount > 2) {
        errors.push(`Group ${group.name}: Too many UEFA teams (${uefaCount}, max is 2)`);
      }

      // Check non-UEFA confederations: max 1 per confederation
      const nonUefaConfeds = confederations.filter(c => c !== 'UEFA');
      const uniqueNonUefa = new Set(nonUefaConfeds);
      if (nonUefaConfeds.length !== uniqueNonUefa.size) {
        errors.push(`Group ${group.name}: Duplicate non-UEFA confederation`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  const handleAnimationComplete = useCallback(() => {
    if (!drawnTeam) return;

    // Target group was already determined in drawNextTeam
    const targetIndex = lastAssignedGroupIndex;

    if (targetIndex === null || targetIndex === -1) {
      console.error("No target group set for team", drawnTeam);
      setIsAnimating(false);
      setDrawnTeam(null);
      return;
    }

    const newGroups = [...groups];
    newGroups[targetIndex].teams.push(drawnTeam);
    setGroups(newGroups);

    setIsAnimating(false);
    setDrawnTeam(null);

    // Update Available Teams
    const nextAvailable = currentAvailableTeams.filter(t => t.id !== drawnTeam.id);
    setCurrentAvailableTeams(nextAvailable);

    // Check if Pot is finished
    if (nextAvailable.length === 0) {
      setPotIndex(prev => prev + 1);
      setLastAssignedGroupIndex(null); // Reset highlight for new pot
    }

  }, [drawnTeam, groups, currentAvailableTeams, lastAssignedGroupIndex]);

  // Auto Draw Logic
  useEffect(() => {
    if (isAuto && !isFinished && !isAnimating && currentAvailableTeams.length > 0) {
      const timeout = setTimeout(() => {
        drawNextTeam();
      }, 500); // Speed of auto draw
      return () => clearTimeout(timeout);
    }
  }, [isAuto, isFinished, isAnimating, drawNextTeam, currentAvailableTeams]);

  const toggleAuto = () => setIsAuto(!isAuto);

  const completeDrawInstantly = () => {
    if (isFinished) return;

    const newGroups = JSON.parse(JSON.stringify(groups)) as Group[];
    let currentPot = potIndex;

    // Process all remaining pots
    while (currentPot < 4) {
      const teamsInGroups = new Set(newGroups.flatMap(g => g.teams.map(t => t.id)));
      const remainingTeams = ALL_POTS[currentPot].filter(t => !teamsInGroups.has(t.id));

      // Check UEFA constraint: prioritize UEFA teams when critical
      const remainingUEFATeams = remainingTeams.filter(t => t.confederation === 'UEFA');
      const groupsWithUEFASpace = newGroups.filter(g => {
        const uefaCount = g.teams.filter(t => t.confederation === 'UEFA').length;
        return uefaCount < 2 && g.teams.length === currentPot;
      }).length;

      // If UEFA teams count equals available UEFA slots, prioritize UEFA teams
      const shouldPrioritizeUEFA = remainingUEFATeams.length > 0 &&
                                    remainingUEFATeams.length >= groupsWithUEFASpace;

      // Sort teams: UEFA first if critical, otherwise shuffle randomly
      let shuffledTeams: Team[];
      if (shouldPrioritizeUEFA) {
        const nonUEFA = remainingTeams.filter(t => t.confederation !== 'UEFA');
        shuffledTeams = [
          ...remainingUEFATeams.sort(() => Math.random() - 0.5),
          ...nonUEFA.sort(() => Math.random() - 0.5)
        ];
      } else {
        shuffledTeams = [...remainingTeams].sort(() => Math.random() - 0.5);
      }

      // Assign all teams from current pot using constraint-based algorithm
      for (const team of shuffledTeams) {
        // Find groups that need a team from this pot
        const groupsNeedingTeam = newGroups
          .map((group, index) => ({ group, index }))
          .filter(({ group }) => group.teams.length === currentPot);

        // Calculate how many valid teams can go into each group (constraint level)
        const groupConstraints = groupsNeedingTeam.map(({ group, index }) => {
          // Count how many remaining teams can be placed in this group
          const validTeamsForGroup = shuffledTeams.filter(t =>
            !teamsInGroups.has(t.id) && isValidPlacement(group, t)
          );
          return {
            groupIndex: index,
            constraintLevel: validTeamsForGroup.length,
            canPlaceCurrent: isValidPlacement(group, team)
          };
        });

        // Filter to only groups where current team can be placed
        const validConstraints = groupConstraints.filter(gc => gc.canPlaceCurrent);

        if (validConstraints.length > 0) {
          // Sort by constraint level (most constrained first to avoid dead-ends)
          validConstraints.sort((a, b) => a.constraintLevel - b.constraintLevel);

          // If multiple groups have same constraint level, pick randomly among them
          const lowestConstraint = validConstraints[0].constraintLevel;
          const mostConstrained = validConstraints.filter(gc => gc.constraintLevel === lowestConstraint);

          const randomIndex = Math.floor(Math.random() * mostConstrained.length);
          const selectedGroup = mostConstrained[randomIndex];

          newGroups[selectedGroup.groupIndex].teams.push(team);
          teamsInGroups.add(team.id);
        } else {
          console.error("Could not place team:", team.name);
        }
      }

      currentPot++;
    }

    setGroups(newGroups);
    setPotIndex(4);
    setIsFinished(true);
    setIsAuto(false);
    setLastAssignedGroupIndex(null);
  };

  const resetDraw = () => {
    initializeDraw();
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
  };

  const shareDraw = async () => {
    try {
      // Check if we're already viewing a shared draw
      const urlParams = new URLSearchParams(window.location.search);
      const existingId = urlParams.get('id');

      if (existingId) {
        // Already have an ID, just copy the current URL
        await navigator.clipboard.writeText(window.location.href);
        setNotification("Link copied to clipboard!");
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // No existing ID, create a new share
      setNotification("Generating share link...");

      const response = await fetch('/api/save-draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ drawData: groups }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draw');
      }

      const { id } = await response.json();
      const url = `${window.location.origin}${window.location.pathname}?id=${id}`;

      await navigator.clipboard.writeText(url);
      setNotification("Link copied to clipboard!");
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error sharing draw:', error);
      setNotification("Failed to create share link");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleAnalyzeAll = async () => {
    setIsAnalyzing(true);
    const result = await analyzeFullDraw(groups);
    setFullAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(45,212,191,0.5)]">
              26
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="text-lg md:text-xl font-bold tracking-tight">
              FIFA World Cup
            </h1>
            <span className="text-xs text-teal-400 font-semibold tracking-widest uppercase">Draw Simulator</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFinished && (
            <>
              <button 
                onClick={() => drawNextTeam()} 
                disabled={isAnimating || isAuto}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-sm font-bold transition-all shadow-lg shadow-teal-900/20"
              >
                <Play size={16} fill="currentColor" />
                <span className="hidden sm:inline">Pick One</span>
              </button>
              <button
                onClick={toggleAuto}
                className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-bold transition-all ${isAuto ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse' : 'border-slate-600 hover:bg-slate-800 text-slate-300'}`}
              >
                <FastForward size={16} />
                <span className="hidden sm:inline">{isAuto ? 'Pause' : 'Auto Draw'}</span>
              </button>
              <button
                onClick={completeDrawInstantly}
                disabled={isAnimating}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-sm font-bold transition-all shadow-lg shadow-purple-900/30"
              >
                <Zap size={16} fill="currentColor" />
                <span className="hidden sm:inline">Draw All</span>
              </button>
            </>
          )}
          
          {isFinished && (
             <button 
              onClick={handleAnalyzeAll} 
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-900/30"
            >
              <MessageSquare size={16} />
              <span className="hidden sm:inline">{isAnalyzing ? 'AI Thinking...' : 'AI Analysis'}</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-700 mx-1"></div>

          <button onClick={resetDraw} className="p-2 text-slate-400 hover:text-white transition hover:bg-slate-800 rounded-full" title="Reset">
            <RefreshCw size={20} />
          </button>
          
          <button
            onClick={shareDraw}
            disabled={!isFinished}
            className="p-2 text-teal-400 hover:text-teal-300 transition hover:bg-slate-800 rounded-full disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title={isFinished ? "Share Link" : "Complete the draw to share"}
          >
            <Share2 size={20} />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-24 right-4 bg-teal-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce font-bold">
            {notification}
          </div>
        )}

        {/* Draw Stage */}
        <section className="mb-12 relative">
          {!isFinished ? (
            <div className="max-w-xl mx-auto">
               <DrawStage 
                  currentTeam={drawnTeam} 
                  isAnimating={isAnimating} 
                  onAnimationComplete={handleAnimationComplete} 
                  potNumber={potIndex + 1}
               />
               <div className="text-center mt-6 h-8">
                 {isAnimating && drawnTeam && (
                   <div className="inline-flex items-center gap-2 px-4 py-2 text-sm text-teal-400 animate-pulse">
                      Finding eligible group...
                   </div>
                 )}
               </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/50 backdrop-blur rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none"></div>
              <h2 className="text-5xl font-black text-white mb-4 tracking-tight">Draw Complete</h2>
              <p className="text-slate-400 mb-8 text-lg">The stage is set for 2026. Share your prediction!</p>
              
              {fullAnalysis && (
                <div className="max-w-3xl mx-auto bg-slate-950/80 p-8 rounded-xl text-left border border-indigo-500/30 shadow-xl relative z-10">
                  <h3 className="text-indigo-400 font-bold mb-4 flex items-center gap-2 text-xl">
                    <MessageSquare size={24} /> Gemini Analysis
                  </h3>
                  <div className="prose prose-invert prose-lg max-w-none whitespace-pre-wrap leading-relaxed text-slate-300">
                    {fullAnalysis}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groups.map((group: Group, idx: number) => (
            <GroupCard
              key={group.name}
              group={group}
              highlight={idx === lastAssignedGroupIndex}
            />
          ))}
        </section>

      </main>
      
      {/* Footer pot indicator */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-700 px-6 py-3 rounded-full flex justify-center gap-3 text-xs z-40 shadow-2xl">
        {[1, 2, 3, 4].map(pot => (
           <div 
             key={pot} 
             className={`flex flex-col items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 ${potIndex + 1 === pot && !isFinished ? 'bg-teal-500 text-slate-950 font-black border-teal-400 scale-110 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
           >
             <span className="text-[10px] opacity-70">POT</span>
             <span className="text-sm leading-none">{pot}</span>
           </div>
        ))}
      </footer>
    </div>
  );
};

export default App;