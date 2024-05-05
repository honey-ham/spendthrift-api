export const isValidUsername = (username: string) =>
    !(
        username.length < 3 ||
        username.length > 31 ||
        !/^[a-zA-Z0-9_-]+$/.test(username)
    );

export const isValidPassword = (password: string) =>
    !(password.length < 6 || password.length > 255);
