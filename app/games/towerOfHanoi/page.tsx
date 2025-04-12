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
};

const NUM_DISKS = 5;

export default class TowerOfHanoi extends Component<Props, State> {
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
    };
  }

  render() {
    return (
      <main className="container mx-auto px-4 py-8">
        <PageHeader title="Tower of Hanoi" description="Solve the Tower of Hanoi puzzle" />
        {/* Content here */}
      </main>
    );
  }
}
