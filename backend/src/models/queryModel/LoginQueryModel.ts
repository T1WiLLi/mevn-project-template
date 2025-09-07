export type LoginRequest = {
    email: string;
    password: string;
}

export type LoginResponse = {
    message: string;
    user: {
        id: string,
        email: string;
        name: string;
        roles: string[];
        permissions: string[];
    }
}