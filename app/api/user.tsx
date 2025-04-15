import { NextApiRequest, NextApiResponse } from "next";
import { firestore as db } from "../../lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

export const createUser = async (data: any) => {
  const userCollectionRef = collection(db, "users");

  const usernameQuery = query(
    userCollectionRef,
    where("username", "==", data.username)
  );
  const emailQuery = query(userCollectionRef, where("email", "==", data.email));

  const usernameSnapshot = await getDocs(usernameQuery);
  const emailSnapshot = await getDocs(emailQuery);

  if (!usernameSnapshot.empty) {
    throw new Error("Username already exists.");
  }

  if (!emailSnapshot.empty) {
    throw new Error("Email already exists.");
  }

  const docRef = await addDoc(userCollectionRef, {
    ...data,
    createdAt: new Date(),
  });

  return docRef.id;
};

export const createGuestUser = async (data?: any) => {
  const userCollectionRef = collection(db, "users");

  const guestId = `guest-${Math.floor(Math.random() * 10000)}`;

  const docRef = await addDoc(userCollectionRef, {
    ...data,
    userType: "guest",
    guestId: guestId,
    createdAt: new Date(),
  });

  return docRef.id;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const data = req.body;

      let userId;

      if (data.userType === "registered") {
        userId = await createUser(data);
      } else if (data.userType === "guest") {
        userId = await createGuestUser(data);
      } else {
        throw new Error("Invalid userType provided.");
      }

      res.status(200).json({ id: userId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).end();
  }
}
