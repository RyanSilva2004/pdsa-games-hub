"use client";

import React, { Component } from "react";
import { PageHeader } from "@/shared/components/page-header";
import Image from "next/image";
import WinImage from "@/public/icons/win.png";
import LostImage from "@/public/icons/lost.png";

type Props = {};

type State = {
  pegs: number[][]; // Three pegs: A, B, and C, each containing disks
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
  selectedDisk: number | null; // Track the selected disk
  sourcePeg: number | null; // Track the source peg for the selected disk
  timeLimit: number; // Game time limit in seconds
  isGameOver: boolean; // Game over status
};

const NUM_DISKS = 5;
const PEG_HEIGHT = 384;
const DISK_HEIGHT = 20;
const BASE_DISK_WIDTH = 40;

export default class TowerOfHanoi extends Component<Props, State> {
  checkWinCondition() {
    throw new Error("Method not implemented.");
  }
  timerInterval: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      pegs: [
        Array.from({ length: NUM_DISKS }, (_, i) => NUM_DISKS - i), // First peg with disks
        [], // Second peg is empty initially
        [], // Third peg is empty initially
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
      isGameOver: false, // Initially, game is not over
    };
  }

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
  

  render() {
    return (
      <main className="container mx-auto px-4 py-8">
        <PageHeader title="Tower of Hanoi" description="Solve the Tower of Hanoi puzzle" />
        {/* Content here */}
      </main>
    );
  }
}
