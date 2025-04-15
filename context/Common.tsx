"use client";
import React, { createContext, ReactNode, useState } from "react";

type User = {
  username: string;
  name?: string;
  email?: string;
  role?: "admin" | "user" | "guest";
};

type CommonContextType = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
};

type Props = {
  children: ReactNode;
};

export const CommonContext = createContext<CommonContextType>({
  user: {
    username: "",
    name: "",
    email: "",
    role: "guest",
  },
  setUser: () => {},
});

export const CommonProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User>({
    username: "",
    name: "",
    email: "",
    role: "guest",
  });

  return (
    <CommonContext.Provider value={{ user, setUser }}>
      {children}
    </CommonContext.Provider>
  );
};
