"use client"
import { FC, useState } from "react";

interface NameInputProps {
  onSubmit: (name: string) => void;
}

const NameInput: FC<NameInputProps> = ({ onSubmit }) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 w-full max-w-sm">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        className="p-2 border rounded w-full mb-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
      />
      <button
        type="submit"
        className="p-2 bg-pink-500 text-white rounded w-full hover:bg-pink-600"
      >
        Start Game
      </button>
    </form>
  );
};

export default NameInput;