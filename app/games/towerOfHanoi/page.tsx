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
  isGameStarted: boolean;
  startTime: number | null;
  elapsedTime: number;
  isModalOpen: boolean;
  gameMessage: string;
  isHelpModalOpen: boolean;
  playerName: string;
  isNameModalOpen: boolean;
  selectedDisk: number | null;
  sourcePeg: number | null;
  timeLimit: number;
  isGameOver: boolean;
};

const NUM_DISKS = 5;
const PEG_HEIGHT = 384;
const DISK_HEIGHT = 20;
const BASE_DISK_WIDTH = 40;

export default class TowerOfHanoi extends Component<Props, State> {
  timerInterval: NodeJS.Timeout | null = null;

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
      isGameStarted: false,
      startTime: null,
      elapsedTime: 0,
      isModalOpen: false,
      gameMessage: "",
      isHelpModalOpen: false,
      playerName: "",
      isNameModalOpen: true,
      selectedDisk: null,
      sourcePeg: null,
      timeLimit: 300, // 5 minutes
      isGameOver: false,
    };
  }

  componentWillUnmount() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  saveGameToDB = async (playerName: string, moves: number, timeTaken: number) => {
    try {
      const response = await axios.post("/api/towerOfHanoi/saveGame", {
        playerName,
        moves,
        timeTaken,
      });
      console.log("Game saved:", response.data);
    } catch (error) {
      console.error("Error saving game:", error);
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
      "bg-teal-500",
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
    }
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
    this.setState({
      pegs: [
        Array.from({ length: NUM_DISKS }, (_, i) => NUM_DISKS - i),
        [],
        [],
      ],
      moveCount: 0,
      isGameStarted: false,
      startTime: null,
      elapsedTime: 0,
      isModalOpen: false,
      isGameOver: false,
      selectedDisk: null,
      sourcePeg: null,
    });
    if (this.timerInterval) clearInterval(this.timerInterval);
  };

  handlePegClick = (pegIndex: number) => {
    if (this.state.isGameOver || !this.state.isGameStarted) return;
    
    const { pegs, selectedDisk, sourcePeg } = this.state;

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
        
        this.setState({
          pegs: newPegs,
          moveCount: this.state.moveCount + 1,
          selectedDisk: null,
          sourcePeg: null,
        });
        
        this.checkWinCondition();
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
      this.saveGameToDB(this.state.playerName, this.state.moveCount, timeTaken);
      
      this.setState({
        isModalOpen: true,
        gameMessage: "You won!",
        isGameStarted: false,
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
          {!this.state.isGameStarted && (
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
                <p>6. Complete the puzzle before time runs out!</p>
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
              <p className="text-lg mb-4">Moves: {this.state.moveCount}</p>
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