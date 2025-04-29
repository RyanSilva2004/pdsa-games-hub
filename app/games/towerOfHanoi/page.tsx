"use client";

import React, { Component } from "react";
import { PageHeader } from "@/shared/components/page-header";
import Image from "next/image";
import WinImage from "@/public/icons/win.png";
import LostImage from "@/public/icons/lost.png";
import axios from "axios";

type Props = {};

type State = {
  pegs: number[][];
  numDisks: number;
  moveCount: number;
  maxMoves: number;
  moveSequence: string[];
  isGameStarted: boolean;
  startTime: number | null;
  elapsedTime: number;
  isModalOpen: boolean;
  gameMessage: string;
  isHelpModalOpen: boolean;
  isMoveLimitModalOpen: boolean;
  playerName: string;
  isNameModalOpen: boolean;
  isMoveInputModalOpen: boolean;
  selectedDisk: number | null;
  sourcePeg: number | null;
  timeLimit: number;
  isGameOver: boolean;
  isSolving: boolean;
  showSolution: boolean;
  solutionMoves: string[];
  currentSolutionStep: number;
  isFourPegs: boolean;
  recursiveTime: number | null;
  iterativeTime: number | null;
  frameStewartTime: number | null;
  isGameActive: boolean;
  usedAlgorithm: string | null;
  gameStartTime: number | null;
  gameEndTime: number | null;
};

const MIN_DISKS = 5;
const MAX_DISKS = 10;
const PEG_HEIGHT = 384;
const DISK_HEIGHT = 20;
const BASE_DISK_WIDTH = 40;
const TIME_LIMIT = 300;
const DEFAULT_MOVES = 100;
const MIN_MOVES = 30;
const MAX_MOVES = 300;

export default class TowerOfHanoi extends Component<Props, State> {
  timerInterval: NodeJS.Timeout | null = null;
  solutionInterval: NodeJS.Timeout | null = null;
  algorithmStartTime: number | null = null;

  constructor(props: Props) {
    super(props);

    const numDisks = this.getRandomDiskCount();

    this.state = {
      pegs: [
        Array.from({ length: numDisks }, (_, i) => numDisks - i),
        [],
        [],
      ],
      numDisks,
      moveCount: 0,
      maxMoves: DEFAULT_MOVES,
      moveSequence: [],
      isGameStarted: false,
      startTime: null,
      elapsedTime: 0,
      isModalOpen: false,
      gameMessage: "",
      isHelpModalOpen: false,
      isMoveLimitModalOpen: false,
      playerName: "",
      isNameModalOpen: true,
      isMoveInputModalOpen: false,
      selectedDisk: null,
      sourcePeg: null,
      timeLimit: TIME_LIMIT,
      isGameOver: false,
      isSolving: false,
      showSolution: false,
      solutionMoves: [],
      currentSolutionStep: 0,
      isFourPegs: false,
      recursiveTime: null,
      iterativeTime: null,
      frameStewartTime: null,
      isGameActive: false,
      usedAlgorithm: null,
      gameStartTime: null,
      gameEndTime: null,
    };
  }

  componentWillUnmount() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.solutionInterval) clearInterval(this.solutionInterval);
  }

  getRandomDiskCount = () => {
    return Math.floor(Math.random() * (MAX_DISKS - MIN_DISKS + 1)) + MIN_DISKS;
  };

  solveHanoiRecursive = (n: number, source: number, target: number, auxiliary: number): string[] => {
    if (n === 0) return [];
    const moves: string[] = [];
    moves.push(...this.solveHanoiRecursive(n - 1, source, auxiliary, target));
    moves.push(`${String.fromCharCode(65 + source)}->${String.fromCharCode(65 + target)}`);
    moves.push(...this.solveHanoiRecursive(n - 1, auxiliary, target, source));
    return moves;
  };

  solveHanoiIterative = (n: number, source: number, target: number, auxiliary: number): string[] => {
    const moves: string[] = [];
    const stack: any[] = [];
    stack.push({ n, source, target, auxiliary, stage: 0 });

    while (stack.length > 0) {
      const current = stack.pop();
      if (current.n === 1) {
        moves.push(`${String.fromCharCode(65 + current.source)}->${String.fromCharCode(65 + current.target)}`);
      } else {
        switch (current.stage) {
          case 0:
            stack.push({ ...current, stage: 1 });
            stack.push({ n: current.n - 1, source: current.source, target: current.auxiliary, auxiliary: current.target, stage: 0 });
            break;
          case 1:
            moves.push(`${String.fromCharCode(65 + current.source)}->${String.fromCharCode(65 + current.target)}`);
            stack.push({ n: current.n - 1, source: current.auxiliary, target: current.target, auxiliary: current.source, stage: 0 });
            break;
        }
      }
    }
    return moves;
  };

  solveFrameStewart = (n: number, source: number, target: number, aux1: number, aux2: number): string[] => {
    if (n === 0) return [];
    if (n === 1) return [`${String.fromCharCode(65 + source)}->${String.fromCharCode(65 + target)}`];
    
    const k = Math.floor(n / 2);
    const moves: string[] = [];
    
    moves.push(...this.solveFrameStewart(k, source, aux1, target, aux2));
    moves.push(...this.solveHanoiIterative(n - k, source, target, aux2));
    moves.push(...this.solveFrameStewart(k, aux1, target, source, aux2));
    
    return moves;
  };

  showSolution = (algorithm: 'recursive' | 'iterative' | 'frameStewart') => {
    this.algorithmStartTime = Date.now();
    
    let solutionMoves: string[] = [];
    const { numDisks, isFourPegs } = this.state;
    
    if (algorithm === 'recursive') {
      solutionMoves = this.solveHanoiRecursive(numDisks, 0, isFourPegs ? 3 : 2, 1);
    } else if (algorithm === 'iterative') {
      solutionMoves = this.solveHanoiIterative(numDisks, 0, isFourPegs ? 3 : 2, 1);
    } else if (algorithm === 'frameStewart' && isFourPegs) {
      solutionMoves = this.solveFrameStewart(numDisks, 0, 3, 1, 2);
    }

    this.setState({
      solutionMoves,
      showSolution: true,
      currentSolutionStep: 0,
      isSolving: true,
      usedAlgorithm: algorithm,
    });

    this.solutionInterval = setInterval(() => {
      const { currentSolutionStep, solutionMoves } = this.state;
      
      if (currentSolutionStep >= solutionMoves.length) {
        if (this.solutionInterval) clearInterval(this.solutionInterval);
        const algorithmTime = Date.now() - (this.algorithmStartTime || 0);
        
        this.setState({
          isSolving: false,
          [`${algorithm}Time`]: algorithmTime,
        }, () => {
          this.saveAlgorithmTime(algorithm, algorithmTime);
        });
        
        return;
      }
      
      const move = solutionMoves[currentSolutionStep];
      const sourcePeg = move.charCodeAt(0) - 65;
      const targetPeg = move.charCodeAt(3) - 65;
      
      this.moveDisk(sourcePeg, targetPeg);
      
      this.setState(prevState => ({
        currentSolutionStep: prevState.currentSolutionStep + 1,
      }));
    }, 500);
  };

  saveAlgorithmTime = async (algorithm: string, time: number) => {
    try {
      const response = await axios.post("/api/towerOfHanoi/algorithmTime", {
        playerName: this.state.playerName,
        algorithm,
        time,
        numDisks: this.state.numDisks,
        isFourPegs: this.state.isFourPegs,
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error saving algorithm time:", error);
      throw error;
    }
  };

  moveDisk = (sourcePeg: number, targetPeg: number) => {
    const { pegs, isFourPegs } = this.state;
    if (sourcePeg < 0 || targetPeg < 0 || 
        sourcePeg >= (isFourPegs ? 4 : 3) || 
        targetPeg >= (isFourPegs ? 4 : 3)) {
      console.error("Invalid peg index");
      return;
    }

    const diskToMove = pegs[sourcePeg][pegs[sourcePeg].length - 1];
    if (diskToMove === undefined) {
      console.error("No disk to move");
      return;
    }

    const targetTopDisk = pegs[targetPeg][pegs[targetPeg].length - 1];
    if (targetTopDisk !== undefined && targetTopDisk < diskToMove) {
      console.error("Invalid move: larger disk cannot be placed on smaller disk");
      return;
    }

    const newPegs = [...pegs];
    newPegs[sourcePeg] = [...pegs[sourcePeg].slice(0, -1)];
    newPegs[targetPeg] = [...pegs[targetPeg], diskToMove];
    
    const moveDescription = `${String.fromCharCode(65 + sourcePeg)}->${String.fromCharCode(65 + targetPeg)}`;
    
    this.setState(prevState => ({
      pegs: newPegs,
      moveCount: prevState.moveCount + 1,
      moveSequence: [...prevState.moveSequence, moveDescription],
    }), this.checkWinCondition);
  };

  stopSolution = () => {
    if (this.solutionInterval) clearInterval(this.solutionInterval);
    this.setState({
      isSolving: false,
      showSolution: false,
    });
  };

  saveGameToDB = async (playerName: string, moves: number, timeTaken: number, moveSequence: string[]) => {
    try {
      const gameData = {
        playerName,
        moves,
        timeTaken,
        moveSequence,
        numDisks: this.state.numDisks,
        isFourPegs: this.state.isFourPegs,
        usedAlgorithm: this.state.usedAlgorithm,
        gameStartTime: this.state.gameStartTime,
        gameEndTime: Date.now(),
      };

      if (!playerName || typeof moves !== 'number' || typeof timeTaken !== 'number' || !Array.isArray(moveSequence)) {
        throw new Error("Invalid game data");
      }

      const response = await axios.post("/api/towerOfHanoi", gameData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error saving game:", error);
      throw error;
    }
  };

  getDiskColor = (diskSize: number) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-cyan-500",
    ];
    return colors[diskSize % colors.length];
  };

  formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  formatMilliseconds = (ms: number | null) => {
    if (ms === null) return "N/A";
    return `${ms}ms`;
  };

  handleNameSubmit = () => {
    if (this.state.playerName.trim() !== "") {
      this.setState({ 
        isNameModalOpen: false,
        isMoveInputModalOpen: true,
      });
    }
  };

  handleMoveInputSubmit = (maxMoves: number) => {
    const validatedMoves = Math.max(MIN_MOVES, Math.min(MAX_MOVES, maxMoves));
    
    this.setState({ 
      maxMoves: validatedMoves,
      isMoveInputModalOpen: false,
      isGameStarted: true,
      isGameActive: false,
    });
  };

  handleStartGame = () => {
    this.setState({
      isGameActive: true,
      gameStartTime: Date.now(),
      startTime: Date.now(),
      elapsedTime: 0,
    });

    this.timerInterval = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - (this.state.startTime || 0)) / 1000);
      
      if (elapsedTime >= this.state.timeLimit) {
        this.setState({
          isModalOpen: true,
          gameMessage: "Game over! Time's up!",
          isGameOver: true,
          isGameActive: false,
          gameEndTime: Date.now(),
        });
        if (this.timerInterval) clearInterval(this.timerInterval);
        return;
      }

      this.setState({ elapsedTime });
    }, 1000);
  };

  handleRestart = () => {
    const numDisks = this.getRandomDiskCount();
    const initialPegs = this.state.isFourPegs 
      ? [Array.from({ length: numDisks }, (_, i) => numDisks - i), [], [], []]
      : [Array.from({ length: numDisks }, (_, i) => numDisks - i), [], []];

    if (this.solutionInterval) clearInterval(this.solutionInterval);
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.setState({
      pegs: initialPegs,
      numDisks,
      moveCount: 0,
      maxMoves: DEFAULT_MOVES,
      moveSequence: [],
      isGameStarted: false,
      isGameActive: false,
      startTime: null,
      elapsedTime: 0,
      isModalOpen: false,
      isGameOver: false,
      isMoveLimitModalOpen: false,
      selectedDisk: null,
      sourcePeg: null,
      isSolving: false,
      showSolution: false,
      solutionMoves: [],
      currentSolutionStep: 0,
      recursiveTime: null,
      iterativeTime: null,
      frameStewartTime: null,
      usedAlgorithm: null,
      gameStartTime: null,
      gameEndTime: null,
      isNameModalOpen: true,
    });
  };

  togglePegCount = () => {
    const { isFourPegs } = this.state;
    const numDisks = this.getRandomDiskCount();
    const initialPegs = !isFourPegs 
      ? [Array.from({ length: numDisks }, (_, i) => numDisks - i), [], [], []]
      : [Array.from({ length: numDisks }, (_, i) => numDisks - i), [], []];

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.solutionInterval) clearInterval(this.solutionInterval);

    this.setState({
      isFourPegs: !isFourPegs,
      pegs: initialPegs,
      numDisks,
      moveCount: 0,
      maxMoves: DEFAULT_MOVES,
      moveSequence: [],
      isGameStarted: false,
      isGameActive: false,
      startTime: null,
      elapsedTime: 0,
      isModalOpen: false,
      isGameOver: false,
      isMoveLimitModalOpen: false,
      selectedDisk: null,
      sourcePeg: null,
      isSolving: false,
      showSolution: false,
      solutionMoves: [],
      currentSolutionStep: 0,
      recursiveTime: null,
      iterativeTime: null,
      frameStewartTime: null,
      usedAlgorithm: null,
      gameStartTime: null,
      gameEndTime: null,
      isNameModalOpen: true,
    });
  };

  handlePegClick = (pegIndex: number) => {
    if (this.state.isGameOver || !this.state.isGameStarted || this.state.isSolving || !this.state.isGameActive) return;
    
    const { pegs, selectedDisk, sourcePeg, moveCount, maxMoves, isFourPegs } = this.state;

    if (selectedDisk === null) {
      if (pegs[pegIndex].length > 0) {
        const diskToMove = pegs[pegIndex][pegs[pegIndex].length - 1];
        this.setState({ 
          selectedDisk: diskToMove,
          sourcePeg: pegIndex,
        });
      }
    } else {
      const targetPeg = pegs[pegIndex];
      
      if (targetPeg.length === 0 || targetPeg[targetPeg.length - 1] > selectedDisk) {
        const newPegs = [...pegs];
        newPegs[sourcePeg!].pop();
        newPegs[pegIndex].push(selectedDisk);
        
        const moveDescription = `${String.fromCharCode(65 + sourcePeg!)}->${String.fromCharCode(65 + pegIndex)}`;
        const newMoveCount = moveCount + 1;
        
        this.setState({
          pegs: newPegs,
          moveCount: newMoveCount,
          moveSequence: [...this.state.moveSequence, moveDescription],
          selectedDisk: null,
          sourcePeg: null,
        }, () => {
          if (newMoveCount >= maxMoves) {
            this.setState({
              isMoveLimitModalOpen: true,
              isGameActive: false,
              isGameOver: true,
              gameEndTime: Date.now(),
            });
            if (this.timerInterval) clearInterval(this.timerInterval);
          } else {
            this.checkWinCondition();
          }
        });
      } else {
        this.setState({ 
          selectedDisk: null,
          sourcePeg: null,
        });
      }
    }
  };

  checkWinCondition = () => {
    const { pegs, moveCount, elapsedTime, moveSequence, isFourPegs, isGameActive } = this.state;
    const targetPeg = isFourPegs ? 3 : 2;
    
    if (pegs[targetPeg].length === this.state.numDisks) {
      this.saveGameToDB(
        this.state.playerName, 
        moveCount, 
        elapsedTime,
        moveSequence
      )
        .then(() => {
          this.setState({
            isModalOpen: true,
            gameMessage: "You won!",
            isGameActive: false,
            gameEndTime: Date.now(),
          });
        })
        .catch((error) => {
          console.error("Failed to save game:", error);
          this.setState({
            isModalOpen: true,
            gameMessage: "You won! (Score not saved)",
            isGameActive: false,
            gameEndTime: Date.now(),
          });
        });
  
      if (this.timerInterval) clearInterval(this.timerInterval);
    }
  };

  render() {
    const { isFourPegs, numDisks, recursiveTime, iterativeTime, frameStewartTime, isGameActive } = this.state;
    const pegLetters = isFourPegs ? ["A", "B", "C", "D"] : ["A", "B", "C"];

    return (
      <main className="container mx-auto px-4 py-8">
        <PageHeader title="Tower of Hanoi" description="Solve the Tower of Hanoi puzzle" />

        <div className="flex flex-wrap justify-center items-center mb-8 gap-4">
          {isGameActive && (
            <span className={`text-lg font-semibold ${
              this.state.timeLimit - this.state.elapsedTime <= 30 
                ? "text-red-500 animate-pulse" 
                : "text-gray-700"
            }`}>
              Time: {this.formatTime(this.state.elapsedTime)} / {this.formatTime(this.state.timeLimit)}
            </span>
          )}
          
          <span className="text-lg font-semibold">
            Moves: {this.state.moveCount}/{this.state.maxMoves}
          </span>
          
          <span className="text-lg font-semibold">
            Disks: {numDisks}
          </span>
          
          <button
            onClick={this.togglePegCount}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            {isFourPegs ? "Switch to 3 Pegs" : "Switch to 4 Pegs"}
          </button>
          
          {this.state.isGameStarted && !isGameActive && (
            <button
              onClick={this.handleStartGame}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Start Game
            </button>
          )}
          
          <button
            onClick={() => this.setState({ isHelpModalOpen: true })}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Help
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-start gap-8">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {pegLetters.map((peg, pegIndex) => (
              <div key={peg} className="flex flex-col items-center">
                <div
                  className="w-48 h-96 relative cursor-pointer"
                  onClick={() => this.handlePegClick(pegIndex)}
                >
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-64 bg-amber-700 rounded"></div>
                  <div className="absolute bottom-0 left-0 w-full h-4 bg-amber-800 rounded"></div>
                  
                  {this.state.pegs[pegIndex].map((disk, diskIndex) => (
                    <div
                      key={diskIndex}
                      className={`absolute left-1/2 transform -translate-x-1/2 rounded-md ${
                        this.state.selectedDisk === disk && this.state.sourcePeg === pegIndex 
                          ? "opacity-50" 
                          : "opacity-100"
                      } ${this.getDiskColor(disk)}`}
                      style={{
                        width: `${BASE_DISK_WIDTH + (disk * 20)}px`,
                        height: `${DISK_HEIGHT}px`,
                        bottom: `${(diskIndex * DISK_HEIGHT) + DISK_HEIGHT}px`,
                        zIndex: diskIndex,
                      }}
                    />
                  ))}
                </div>
                <span className="mt-2 text-lg font-semibold">{peg}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center p-4 border rounded-lg shadow-lg w-full md:w-64">
            <h2 className="text-xl font-bold text-gray-800">Controls</h2>
            
            <div className="w-full mt-4">
              <button
                onClick={this.handleRestart}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                New Game
              </button>
            </div>
            
            {!this.state.isSolving && !this.state.showSolution && (
              <div className="w-full mt-4 space-y-2">
                <button
                  onClick={() => this.showSolution('recursive')}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  disabled={isFourPegs || !this.state.isGameStarted}
                >
                  Recursive Solution
                </button>
                
                <button
                  onClick={() => this.showSolution('iterative')}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                  disabled={isFourPegs || !this.state.isGameStarted}
                >
                  Iterative Solution
                </button>
                
                {isFourPegs && (
                  <button
                    onClick={() => this.showSolution('frameStewart')}
                    className="w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
                    disabled={!this.state.isGameStarted}
                  >
                    Frame-Stewart Solution
                  </button>
                )}
              </div>
            )}
            
            {this.state.isSolving && (
              <button
                onClick={this.stopSolution}
                className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Stop Solution
              </button>
            )}
            
            <div className="w-full mt-6">
              <h3 className="text-lg font-semibold mb-2">Algorithm Times</h3>
              <div className="text-sm space-y-1">
                <p>Recursive: {this.formatMilliseconds(recursiveTime)}</p>
                <p>Iterative: {this.formatMilliseconds(iterativeTime)}</p>
                {isFourPegs && <p>Frame-Stewart: {this.formatMilliseconds(frameStewartTime)}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Name Input Modal */}
        {this.state.isNameModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Enter Your Name
              </h3>
              <input
                type="text"
                value={this.state.playerName}
                onChange={(e) => this.setState({ playerName: e.target.value })}
                placeholder="Your name"
                className="w-full px-4 py-2 mb-4 border rounded"
                min={30}
                max={300}
                onKeyDown={(e) => e.key === 'Enter' && this.handleNameSubmit()}
              />
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                onClick={this.handleNameSubmit}
                disabled={this.state.playerName.trim() === ""}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Move Input Modal */}
        {this.state.isMoveInputModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Game Moves
              </h3>
              <p className="mb-4">You have {numDisks} disks. Enter the maximum number of moves allowed (30-300):</p>
              <input
                type="number"
                min={MIN_MOVES}
                max={MAX_MOVES}
                defaultValue={DEFAULT_MOVES}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    const clampedValue = Math.max(MIN_MOVES, Math.min(MAX_MOVES, value));
                    this.setState({ maxMoves: clampedValue });
                  }
                }}
                className="w-full px-4 py-2 mb-4 border rounded"
                onKeyDown={(e) => e.key === 'Enter' && this.handleMoveInputSubmit(this.state.maxMoves)}
              />
              <p className="text-sm text-gray-600 mb-4">
                Minimum: {MIN_MOVES}, Maximum: {MAX_MOVES}
              </p>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => this.handleMoveInputSubmit(this.state.maxMoves)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Move Limit Reached Modal */}
        {this.state.isMoveLimitModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
              <div className="mb-4 flex justify-center">
                <Image src={LostImage} alt="Move Limit Reached" width={100} height={100} className="mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Move Limit Reached!
              </h3>
              <div className="space-y-2 mb-4">
                <p className="text-gray-700">You used all {this.state.maxMoves} moves.</p>
                {isGameActive && <p className="text-gray-700">Time: {this.formatTime(this.state.elapsedTime)}</p>}
                <p className="text-gray-700">Disks: {numDisks}</p>
              </div>
              <button
                onClick={this.handleRestart}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {this.state.isHelpModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">How to Play</h3>
              <div className="text-sm text-gray-600 mb-6 space-y-2">
                <p><strong>Objective:</strong> Move all disks from the first peg to the last peg.</p>
                <p><strong>Rules:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Only one disk can be moved at a time.</li>
                  <li>A larger disk cannot be placed on a smaller disk.</li>
                  <li>You can use the auxiliary pegs to help move the disks.</li>
                </ul>
                
                <p><strong>Controls:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Click "Start Game" to begin the game timer</li>
                  <li>Click on a peg to select its top disk</li>
                  <li>Click on another peg to move the selected disk there</li>
                  <li>Use the solution buttons to see automated solutions</li>
                  <li>Switch between 3 and 4 peg versions</li>
                </ul>
                
                <p><strong>Game Settings:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Number of disks: Random between 5-10</li>
                  <li>Move limit: Between 30-300 moves</li>
                  <li>Time limit: 5 minutes (300 seconds)</li>
                </ul>
              </div>
              <button
                onClick={() => this.setState({ isHelpModalOpen: false })}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {this.state.isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80 max-h-[80vh] overflow-y-auto text-center">
              {this.state.gameMessage === "You won!" && (
                <div className="mb-4 flex justify-center">
                  <Image src={WinImage} alt="You Won" width={100} height={100} className="mx-auto" />
                </div>
              )}
              {this.state.gameMessage.includes("Game over") && (
                <div className="mb-4 flex justify-center">
                  <Image src={LostImage} alt="Game Over" width={100} height={100} className="mx-auto" />
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {this.state.gameMessage}
              </h3>
              <div className="space-y-2 mb-4">
                {isGameActive && <p className="text-gray-700">Time: {this.formatTime(this.state.elapsedTime)}</p>}
                <p className="text-gray-700">Total Moves: {this.state.moveCount}</p>
                <p className="text-gray-700">Disks: {numDisks}</p>
                <p className="text-gray-700">Pegs: {isFourPegs ? "4" : "3"}</p>
                {this.state.usedAlgorithm && <p className="text-gray-700">Used Algorithm: {this.state.usedAlgorithm}</p>}
              </div>
              
              {this.state.moveSequence.length > 0 && (
                <div className="max-h-40 overflow-y-auto mb-4 border rounded p-2">
                  <h4 className="font-semibold mb-1 text-gray-800">Move Sequence:</h4>
                  <div className="text-sm grid grid-cols-3 gap-1 text-gray-700">
                    {this.state.moveSequence.map((move, index) => (
                      <span key={index}>{index + 1}. {move}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {(recursiveTime || iterativeTime || (isFourPegs && frameStewartTime)) && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-1 text-gray-800">Algorithm Times:</h4>
                  <div className="text-sm space-y-1 text-gray-700">
                    {recursiveTime && <p>Recursive: {this.formatMilliseconds(recursiveTime)}</p>}
                    {iterativeTime && <p>Iterative: {this.formatMilliseconds(iterativeTime)}</p>}
                    {isFourPegs && frameStewartTime && <p>Frame-Stewart: {this.formatMilliseconds(frameStewartTime)}</p>}
                  </div>
                </div>
              )}
              
              <button
                onClick={this.handleRestart}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }
}