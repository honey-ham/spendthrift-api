export type paths = {
    "/v1/signup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a new account */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UserSignup"];
                };
            };
            responses: {
                /** @description Account created */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Success"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
};
export type webhooks = Record<string, never>;
export type components = {
    schemas: {
        /** @description Used for creating a user account with the minimum possible info */
        MinimumUser: {
            /** @example John */
            firstName: string;
            /** @example Doe */
            lastName: string;
            /** @example jdoe3 */
            username: string;
            /**
             * @description Password hash
             * @example 1234Password
             */
            password: string;
            /** @example jdoe3@gmail.com */
            email: string;
        };
        User: components["schemas"]["MinimumUser"] & {
            /**
             * @description UUID that uniquely identifies a user
             * @example acde070d-8c4c-4f0d-9d8a-162843c10333
             */
            id: string;
            /** @description Prevents the user from using their account when true (Admin control) */
            isLocked: boolean;
            /** @description Indicates when a user has verified their email + Prevents a user from using their account */
            isVerified: boolean;
            /**
             * Format: date-time
             * @description Last time a verification email was sent to the user
             */
            lastVerificationAttempt: Date;
            /**
             * @description UUID of the permission assigned to the user
             * @example acde070d-8c4c-4f0d-9d8a-162843c10340
             */
            permissionId: string;
        };
        UserSignup: {
            /** @example John */
            firstName: string;
            /** @example Doe */
            lastName: string;
            /** @example jdoe3 */
            username: string;
            /**
             * @description Plain text password (Not a hash)
             * @example 1234Password
             */
            password: string;
            /**
             * @description Must match password
             * @example 1234Password
             */
            passwordConfirm: string;
            /** @example jdoe3@gmail.com */
            email: string;
            /** @example jdoe3@gmail.com */
            emailConfirm: string;
        };
        Success: {
            /** @example Success! */
            message?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
};
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
