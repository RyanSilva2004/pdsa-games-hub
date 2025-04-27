
import { FC } from "react";

interface KnightProps {
  position: { row: number; col: number };
}

const Knight: FC<KnightProps> = ({ position }) => {
  return (
    <div
      className="absolute w-[50px] h-[50px] flex items-center justify-center"
      style={{
        transform: `translate(${position.col * 50}px, ${position.row * 50}px)`,
      }}
    >
      <span className="text-4xl mr-2 text-black leading-none">♞</span>
    </div>
  );
};

export default Knight;