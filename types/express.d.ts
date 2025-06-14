declare global {
  namespace Express {
    interface Request {
      user?: any; // Use `any` if you don't have a UserDocument type
    }
  }
}