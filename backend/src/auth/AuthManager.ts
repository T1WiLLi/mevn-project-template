// auth/AuthManager.ts
import { IAuthProvider } from "./interfaces/IAuthProvider";

class AuthManager {
    private static provider: IAuthProvider | null = null;

    static registerProvider(provider: IAuthProvider) {
        this.provider = provider;
    }

    static getProvider(): IAuthProvider {
        if (!this.provider) {
            throw new Error("No AuthProvider has been registered. Call AuthManager.registerProvider() first.");
        }
        return this.provider;
    }
}

export { AuthManager };