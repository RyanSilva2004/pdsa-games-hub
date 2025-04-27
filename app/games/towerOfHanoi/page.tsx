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
  maxMoves: number | null;
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
  isMoveLimitModal: boolean;
  selectedDisk: number | null;
  sourcePeg: number | null;
  timeLimit: number;
  isGameOver: boolean;
  isSolving: boolean;
  showSolution: boolean;
  solutionMoves: string[];
  currentSolutionStep: number;
};

const NUM_DISKS = 5;
const PEG_HEIGHT = 384;
const DISK_HEIGHT = 20;
const BASE_DISK_WIDTH = 40;

export default class TowerOfHanoi extends Component<Props, State> {
  timerInterval: NodeJS.Timeout | null = null;
  solutionInterval: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      pegs: [
        Array.from({ length: NUM_DISKS }, (_, i) => NUM_DISKS - i),
        [],
        [],
      ],
      numDisks: NUM_DISKS,
      moveCount: 0,
      maxMoves: null,
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
      isMoveLimitModal: false,
      selectedDisk: null,
      sourcePeg: null,
      timeLimit: 300,
      isGameOver: false,
      isSolving: false,
      showSolution: false,
      solutionMoves: [],
      currentSolutionStep: 0,
    };
  }

  componentWillUnmount() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.solutionInterval) clearInterval(this.solutionInterval);
  }

  // Recursive algorithm to solve Tower of Hanoi
  solveHanoiRecursive = (n: number, source: number, target: number, auxiliary: number): string[] => {
    if (n === 0) {
      return [];
    }
    
    const moves: string[] = [];
    
    // Move n-1 disks from source to auxiliary peg
    moves.push(...this.solveHanoiRecursive(n - 1, source, auxiliary, target));
    
    // Move the nth disk from source to target
    const move = `${String.fromCharCode(65 + source)}->${String.fromCharCode(65 + target)}`;
    moves.push(move);
    
    // Move the n-1 disks from auxiliary to target peg
    moves.push(...this.solveHanoiRecursive(n - 1, auxiliary, target, source));
    
    return moves;
  };

  // Iterative algorithm to solve Tower of Hanoi
  solveHanoiIterative = (n: number, source: number, target: number, auxiliary: number): string[] => {
    const moves: string[] = [];
    const stack: any[] = [];
    
    stack.push({ n, source, target, auxiliary, stage: 0 });
    
    while (stack.length > 0) {
      const current = stack.pop();
      
      if (current.n === 1) {
        
        const move = `${String.fromCharCode(65 + current.source)}->${String.fromCharCode(65 + current.target)}`;
        moves.push(move);
      } else {
        switch (current.stage) {
          case 0:
            // Stage 0: process first recursive call
            stack.push({ ...current, stage: 1 });
            stack.push({ 
              n: current.n - 1, 
              source: current.source, 
              target: current.auxiliary, 
              auxiliary: current.target, 
              stage: 0 
            });
            break;
          case 1:
            // Stage 1: process the move
            const move = `${String.fromCharCode(65 + current.source)}->${String.fromCharCode(65 + current.target)}`;
            moves.push(move);
            // Stage 2: process second recursive call
            stack.push({ 
              n: current.n - 1, 
              source: current.auxiliary, 
              target: current.target, 
              auxiliary: current.source, 
              stage: 0 
            });
            break;
        }
      }
    }
    
    return moves;
  };

  showSolution = (iterative = false) => {
    const solutionMoves = iterative 
      ? this.solveHanoiIterative(this.state.numDisks, 0, 2, 1)
      : this.solveHanoiRecursive(this.state.numDisks, 0, 2, 1);
    
    this.setState({
      solutionMoves,
      showSolution: true,
      currentSolutionStep: 0,
      isSolving: true,
    });

    this.solutionInterval = setInterval(() => {
      const { currentSolutionStep, solutionMoves } = this.state;
      
      if (currentSolutionStep >= solutionMoves.length) {
        if (this.solutionInterval) clearInterval(this.solutionInterval);
        this.setState({ isSolving: false });
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

  moveDisk = (sourcePeg: number, targetPeg: number) => {
    const { pegs } = this.state;
    const diskToMove = pegs[sourcePeg][pegs[sourcePeg].length - 1];
    
    const newPegs = [...pegs];
    newPegs[sourcePeg].pop();
    newPegs[targetPeg].push(diskToMove);
    
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
      const response = await axios.post(
        "/api/towerOfHanoi",
        {
          playerName,
          moves,
          timeTaken,
          moveSequence,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
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
    ];
    return colors[diskSize % colors.length];
  };

  formatTime(timeInSeconds: number) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  handleNameSubmit = () => {
    if (this.state.playerName.trim() !== "") {
      this.setState({ 
        isNameModalOpen: false,
        isMoveLimitModal: true,
      });
    }
  };

  handleMoveLimitSubmit = (maxMoves: number) => {
    this.setState({ 
      maxMoves,
      isMoveLimitModal: false,
      isGameStarted: true,
      startTime: Date.now(),
    });

    this.timerInterval = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - (this.state.startTime ?? 0)) / 1000);
      
      if (elapsedTime >= this.state.timeLimit) {
        this.setState({
          isModalOpen: true,
          gameMessage: "Game over! Time's up!",
          isGameOver: true,
          isGameStarted: false,
        });
        if (this.timerInterval) clearInterval(this.timerInterval);
        return;
      }

      this.setState({ elapsedTime });
    }, 1000);
  };

  handleStartGame = () => {
    this.setState({
      isGameStarted: true,
      startTime: Date.now(),
      isGameOver: false,
    });

    this.timerInterval = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - (this.state.startTime ?? 0)) / 1000);
      
      if (elapsedTime >= this.state.timeLimit) {
        this.setState({
          isModalOpen: true,
          gameMessage: "Game over! Time's up!",
          isGameOver: true,
          isGameStarted: false,
        });
        if (this.timerInterval) clearInterval(this.timerInterval);
        return;
      }

      this.setState({ elapsedTime });
    }, 1000);
  };

  handleRestart = () => {
    if (this.solutionInterval) clearInterval(this.solutionInterval);
    this.setState({
      pegs: [
        Array.from({ length: NUM_DISKS }, (_, i) => NUM_DISKS - i),
        [],
        [],
      ],
      moveCount: 0,
      maxMoves: null,
      moveSequence: [],
      isGameStarted: false,
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
    });
    if (this.timerInterval) clearInterval(this.timerInterval);
  };

  handlePegClick = (pegIndex: number) => {
    if (this.state.isGameOver || !this.state.isGameStarted || this.state.isSolving) return;
    
    const { pegs, selectedDisk, sourcePeg, moveSequence, moveCount, maxMoves } = this.state;

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
          moveSequence: [...moveSequence, moveDescription],
          selectedDisk: null,
          sourcePeg: null,
        }, () => {
          
          if (maxMoves !== null && newMoveCount >= maxMoves) {
            this.setState({
              isMoveLimitModalOpen: true,
              isGameStarted: false,
              isGameOver: true,
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
    if (this.state.pegs[2].length === NUM_DISKS) {
      const timeTaken = this.state.elapsedTime;
      this.saveGameToDB(
        this.state.playerName, 
        this.state.moveCount, 
        timeTaken,
        this.state.moveSequence
      )
        .then(() => {
          this.setState({
            isModalOpen: true,
            gameMessage: "You won!",
            isGameStarted: false,
          });
        })
        .catch((error) => {
          console.error("Failed to save game:", error);
          this.setState({
            isModalOpen: true,
            gameMessage: "You won! (Score not saved)",
            isGameStarted: false,
          });
        });
  
      if (this.timerInterval) clearInterval(this.timerInterval);
    }
  };

  render() {
    return (
      <main className="container mx-auto px-4 py-8">
        <PageHeader title="Tower of Hanoi" description="Solve the Tower of Hanoi puzzle" />

        <div className="flex justify-center items-center mb-8">
          <span className={`text-lg font-semibold me-4 ${
            this.state.timeLimit - this.state.elapsedTime <= 30 
              ? "text-red-500 animate-pulse" 
              : "text-gray-700"
          }`}>
            Time: {this.formatTime(this.state.elapsedTime)} / {this.formatTime(this.state.timeLimit)}
          </span>
          {this.state.maxMoves !== null && (
            <span className="text-lg font-semibold me-4">
              Moves: {this.state.moveCount}/{this.state.maxMoves}
            </span>
          )}
          {!this.state.isGameStarted && !this.state.isMoveLimitModal && (
            <button
              onClick={this.handleStartGame}
              className="w-32 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Start Game
            </button>
          )}
          <button
            onClick={() => this.setState({ isHelpModalOpen: true })}
            className="w-32 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 ml-4"
          >
            Help
          </button>
        </div>

        <div className="flex justify-center">
          <div className="flex space-x-8">
            {["A", "B", "C"].map((peg, pegIndex) => (
              <div key={peg} className="flex flex-col items-center">
                <div
                  className="w-64 h-96 relative"
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
                      } ${
                        this.getDiskColor(disk)
                      }`}
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

          <div className="flex flex-col items-center p-4 border rounded-lg shadow-lg w-64 ms-5">
            <h2 className="text-xl font-bold text-gray-800">Moves</h2>
            <span className="text-lg font-semibold">{this.state.moveCount}</span>
            <button
              onClick={this.handleRestart}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Restart
            </button>
            {!this.state.isSolving && !this.state.showSolution && (
              <>
                <button
                  onClick={() => this.showSolution(false)}
                  className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 w-full"
                >
                  Show Recursive Solution
                </button>
                <button
                  onClick={() => this.showSolution(true)}
                  className="mt-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 w-full"
                >
                  Show Iterative Solution
                </button>
              </>
            )}
            {this.state.isSolving && (
              <button
                onClick={this.stopSolution}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full"
              >
                Stop Solution
              </button>
            )}
          </div>
        </div>

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
                onKeyDown={(e) => e.key === 'Enter' && this.handleNameSubmit()}
              />
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                onClick={this.handleNameSubmit}
                disabled={this.state.playerName.trim() === ""}
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        {this.state.isMoveLimitModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Set Move Limit
              </h3>
              <p className="mb-4">Enter the maximum number of moves allowed:</p>
              <input
                type="number"
                min="1"
                defaultValue="20"
                onChange={(e) => this.setState({ maxMoves: parseInt(e.target.value) || 20 })}
                className="w-full px-4 py-2 mb-4 border rounded"
                onKeyDown={(e) => e.key === 'Enter' && this.handleMoveLimitSubmit(this.state.maxMoves || 20)}
              />
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => this.handleMoveLimitSubmit(this.state.maxMoves || 20)}
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        {this.state.isMoveLimitModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
              <div className="mb-4 flex justify-center">
                <Image src={LostImage} alt="Move Limit Reached" width={100} height={100} className="mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Move Limit Reached!
              </h3>
              <p className="text-lg mb-2">You used all {this.state.maxMoves} moves.</p>
              <p className="text-lg mb-4">Try again with better strategy!</p>
              <button
                onClick={this.handleRestart}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {this.state.isHelpModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">How to Play</h3>
              <div className="text-sm text-gray-600 mb-6 text-left space-y-2">
                <p>1. Move all disks from peg A to peg C.</p>
                <p>2. Only one disk can be moved at a time.</p>
                <p>3. A larger disk cannot be placed on top of a smaller disk.</p>
                <p>4. Click on a peg to pick up its top disk.</p>
                <p>5. Click on another peg to place the disk there.</p>
                <p>6. Complete the puzzle before time or move limit runs out!</p>
                <p className="mt-4 font-semibold">Solution Algorithms:</p>
                <p>- Recursive: Classic divide-and-conquer approach</p>
                <p>- Iterative: Uses a stack to simulate recursion</p>
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

        {this.state.isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
              {this.state.gameMessage === "You won!" && (
                <div className="mb-4 flex justify-center">
                  <Image src={WinImage} alt="You Won" width={100} height={100} className="mx-auto" />
                </div>
              )}
              {this.state.gameMessage === "Game over! Time's up!" && (
                <div className="mb-4 flex justify-center">
                  <Image src={LostImage} alt="Game Over" width={100} height={100} className="mx-auto" />
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {this.state.gameMessage}
              </h3>
              <p className="text-lg mb-2">Time: {this.formatTime(this.state.elapsedTime)}</p>
              <p className="text-lg mb-2">Total Moves: {this.state.moveCount}</p>
              
              <div className="max-h-40 overflow-y-auto mb-4 border rounded p-2">
                <h4 className="font-semibold mb-1">Move Sequence:</h4>
                <div className="text-sm grid grid-cols-3 gap-1">
                  {this.state.moveSequence.map((move, index) => (
                    <span key={index} className="truncate">{index+1}. {move}</span>
                  ))}
                </div>
              </div>
              
              <button
                onClick={this.handleRestart}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
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