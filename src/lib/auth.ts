import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

export interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, 12);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await compare(password, hashedPassword);
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.NEXTAUTH_SECRET!, {
    expiresIn: "7d",
  });
};

export const validateToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as {
      userId: string;
    };
  } catch {
    return null;
  }
};

export const createUser = async (userData: UserRegistrationData) => {
  const { email, password, name } = userData;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  return user;
};

export const validateUser = async (loginData: UserLoginData) => {
  const { email, password } = loginData;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    throw new Error("Invalid password");
  }

  return user;
};
