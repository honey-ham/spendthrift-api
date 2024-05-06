import { Router, type Request, type Response } from 'express';
import { Argon2id } from 'oslo/password';

import { lucia } from '../lib/auth.js';
import {
    isValidUsername,
    isValidPassword,
    isValidEmail,
    isValidFirstName,
    isValidLastName,
} from '../utils/validation.js';
import {
    type User,
    createUser,
    verifyUser,
    getUserByUsername,
    getUserByEmail,
    getUserById,
} from '../lib/users.js';
import { sendVerificationEmail } from '../lib/email.js';

const router = Router();

router.post('/verifyEmail/:userId', async (req: Request, res: Response) => {
    const id = req.params.userId ?? null;
    if (!id) return res.status(400).json({ error: 'Unable to verify email' });
    const isUserVerified = await verifyUser(id);
    if (isUserVerified)
        return res.status(200).json({
            message: "User's email was successfully verified",
        });
    return res.status(400).json({ error: 'Unable to verify email' });
});

// TODO: Add a date field to db to remember when the last email was sent (To prevent spamming)
router.get(
    '/resendVerificationEmail/:userId',
    async (req: Request, res: Response) => {
        const id = req.params.userId ?? null;
        if (!id)
            return res
                .status(400)
                .json({ error: 'Unable to send verification email' });
        const user = await getUserById(id);
        if (user === null)
            return res
                .status(400)
                .json({ error: 'Unable to send verification email' });

        if (
            (await sendVerificationEmail({
                to: user.email,
                firstName: user.firstName,
                userId: id,
            })) === null
        )
            return res
                .status(400)
                .json({ error: 'Unable to send verification email' });
        else
            return res.status(200).json({ message: 'Sent verification email' });
    },
);

router.post('/signup', async (req: Request, res: Response) => {
    const firstName: string | null = req.body.firstName ?? null;
    const lastName: string | null = req.body.firstName ?? null;
    const username: string | null = req.body.username ?? null;
    const password: string | null = req.body.password ?? null;
    const passwordConfirm: string | null = req.body.passwordConfirm ?? null;
    const email: string | null = req.body.email ?? null;
    const emailConfirm: string | null = req.body.emailConfirm ?? null;

    if (!firstName || !isValidFirstName(firstName))
        return res.status(400).json({ error: `Illegal first name` });
    if (!lastName || !isValidLastName(lastName))
        return res.status(400).json({ error: `Illegal last name` });
    if (!username || !isValidUsername(username))
        return res.status(400).json({ error: `Illegal username` });
    if (!password || !isValidPassword(password))
        return res.status(400).json({ error: `Illegal password` });
    if (!passwordConfirm || password !== passwordConfirm)
        return res.status(400).json({ error: `Passwords didn't match` });
    if (!email || !isValidEmail(email))
        return res.status(400).json({ error: `Illegal email` });
    if (!emailConfirm || email !== emailConfirm)
        return res.status(400).json({ error: `Emails didn't match` });

    // Checking for existing users with the same username or password
    let prexistingUser = await getUserByUsername(username);
    if (prexistingUser)
        return res.status(400).json({ error: `Username already exists` });
    prexistingUser = await getUserByEmail(req.body.email);
    if (prexistingUser)
        return res.status(400).json({ error: `Email already exists` });

    const hashedPassword = await new Argon2id().hash(password);

    try {
        const newUser: User = {
            username,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
            email: email,
        };
        const dbRes = await createUser(newUser);
        if (dbRes === null || dbRes.id === undefined)
            return res
                .status(500)
                .json({ error: `Unable to insert user into db` });
        const session = await lucia.createSession(dbRes.id, {});

        // Send email to user to verify the email address they provided
        await sendVerificationEmail({ to: email, firstName, userId: dbRes.id });

        return res
            .appendHeader(
                'Set-Cookie',
                lucia.createSessionCookie(session.id).serialize(),
            )
            .status(200)
            .json({ message: 'Sign-up successful' });
    } catch (e) {
        console.error(e);
    }
});

router.post('/signin', async (req, res) => {
    const username: string | null = req.body.username ?? null;
    const password: string | null = req.body.password ?? null;

    if (!username || !isValidUsername(username))
        return res.status(400).json({ error: `Illegal username` });
    if (!password || !isValidPassword(password))
        return res.status(400).json({ error: `Illegal password` });

    const user = await getUserByUsername(username);

    if (!user || user.id === undefined)
        return res.status(400).json({ error: 'Invalid username or password' });

    const validPassword = await new Argon2id().verify(user.password, password);
    if (!validPassword)
        return res.status(400).json({ error: 'Invalid username or password' });

    const session = await lucia.createSession(user.id, {});
    return res
        .appendHeader(
            'Set-Cookie',
            lucia.createSessionCookie(session.id).serialize(),
        )
        .status(200)
        .json({ message: 'Sign-in successful' });
});

router.post('/signout', async (_, res) => {
    if (!res.locals.session) return res.status(401).end();
    await lucia.invalidateSession(res.locals.session.id);
    return res
        .status(200)
        .setHeader('Set-Cookie', lucia.createBlankSessionCookie().serialize())
        .json({ message: 'Sign-out successful' });
});

export default router;
