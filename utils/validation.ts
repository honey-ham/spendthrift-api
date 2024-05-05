const isValidUsername = (username: string) =>
    !(
        username.length < 3 ||
        username.length > 31 ||
        !/^[a-zA-Z0-9_-]+$/.test(username)
    );

const isValidPassword = (password: string) => {
    const passRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,255}$/;
    return passRegex.test(password);
};

const isValidEmail = (email: string) => {
    const emailRegex =
        /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
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
