"use client";
import { FC, useState } from "react";

interface NameInputProps {
  onSubmit: (name: string) => void;
}

const NameInput: FC<NameInputProps> = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }
    
    if (trimmedName.length > 20) {
      setError("Name must be less than 20 characters");
      return;
    }
    
    if (!/^[a-zA-Z0-9 ]+$/.test(trimmedName)) {
      setError("Name can only contain letters, numbers, and spaces");
      return;
    }
    
    setError(null);
    onSubmit(trimmedName);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 w-full max-w-sm">
      <input
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (error) setError(null);
        }}
        placeholder="Enter your name"
        className={`p-2 border rounded w-full mb-2 focus:outline-none focus:ring-2 ${
          error ? "border-red-500 focus:ring-red-500" : "focus:ring-pink-500"
        }`}
        maxLength={20}
      />
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
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