const isValidUsername = (username: string) =>
    !(
        username.length < 3 ||
        username.length > 31 ||
        !/^[a-zA-Z0-9_-]+$/i.test(username)
    );

const isValidPassword = (password: string) => {
    const passRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,255}$/i;
    return passRegex.test(password);
};

const isValidEmail = (email: string) => {
    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/i;
    return emailRegex.test(email);
};

const nameRegex = /^[a-z ,.'-]+$/i;
const isValidFirstName = (firstName: string) =>
    nameRegex.test(firstName) && firstName.length <= 255;
const isValidLastName = (lastName: string) =>
    nameRegex.test(lastName) && lastName.length <= 255;

export {
    isValidUsername,
    isValidPassword,
    isValidEmail,
    isValidFirstName,
    isValidLastName,
};
