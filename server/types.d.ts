import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user: User | null;
      session: {
        userId?: number;
        destroy: (callback?: () => void) => boolean;
        [key: string]: any;
      };
    }
  }
}

declare module "multer" {
  interface File {
    filename: string;
  }
}