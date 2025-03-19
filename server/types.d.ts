import { User } from "@shared/schema";
import { Session, SessionData } from "express-session";

declare global {
  namespace Express {
    interface Request {
      user: User | null;
      session: Session & Partial<SessionData> & {
        userId?: number;
      };
    }
  }
}

declare module "multer" {
  interface File {
    filename: string;
  }
}