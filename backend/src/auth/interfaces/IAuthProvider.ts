import { Request, Response } from "express";
import { IAuthUser } from "./IAuthUser";

export interface IAuthProvider {
    /**
     * Extract and validate user from request
     * Should return user or null if not authenticated
     */
    getUser(req: Request): Promise<IAuthUser | null>;
}