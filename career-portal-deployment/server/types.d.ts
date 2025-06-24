import { User } from "@shared/schema";
import { Session, SessionData } from "express-session";

// Extend the SessionData interface to add userId
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      user: User | null;
      session: Session & Partial<SessionData>;
    }
  }
}

declare module "multer" {
  interface File {
    filename: string;
  }
}