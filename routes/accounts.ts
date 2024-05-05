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
    const dbRes = await verifyUser(id);
    if (dbRes)
        return res.status(200).json({
            message: "User's email was successfully verified",
        });
    return res.status(400).json({ error: 'Unable to verify email' });
});

router.get(
    '/resendVerificationEmail/:userId',
    async (req: Request, res: Response) => {
        const id = req.params.userID ?? null;
        if (!id)
            return res
                .status(400)
                .json({ error: 'Unable to send verification email' });
        const dbRes = await getUserById(id);
        if (dbRes === null)
            return res
                .status(400)
                .json({ error: 'Unable to send verification email' });

        await sendVerificationEmail({
            to: dbRes.email,
            firstName: dbRes?.firstName,
            userId: id,
        });
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
        // TODO: Check for errors
        console.log(e);
        // if (e instanceof SqliteError && e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        // 	const html = await renderPage({
        // 		username_value: username,
        // 		error: 'Username already used'
        // 	});
        // 	return res.setHeader('Content-Type', 'text/html').status(400).send(html);
        // }
        // const html = await renderPage({
        // 	username_value: username,
        // 	error: 'An unknown error occurred'
        // });
        // return res.setHeader('Content-Type', 'text/html').status(500).send(html);
    }
});

// router.post('/signin', (req, res) => {
//   const username: string | null = req.body.username ?? null;
//   if (!username || username.length < 3 || username.length > 31 || !/^[a-z0-9_-]+$/.test(username)) {
//     const html = await renderPage({
//       username_value: username ?? '',
//       error: 'Invalid password'
//     });
//     return res.setHeader('Content-Type', 'text/html').status(400).send(html);
//   }
//   const password: string | null = req.body.password ?? null;
//   if (!password || password.length < 6 || password.length > 255) {
//     const html = await renderPage({
//       username_value: username,
//       error: 'Invalid password'
//     });
//     return res.setHeader('Content-Type', 'text/html').status(400).send(html);
//   }

//   const existingUser = db.prepare('SELECT * FROM user WHERE username = ?').get(username) as
//     | DatabaseUser
//     | undefined;
//   if (!existingUser) {
//     const html = await renderPage({
//       username_value: username,
//       error: 'Incorrect username or password'
//     });
//     return res.setHeader('Content-Type', 'text/html').status(400).send(html);
//   }

//   const validPassword = await new Argon2id().verify(existingUser.password, password);
//   if (!validPassword) {
//     const html = await renderPage({
//       username_value: username,
//       error: 'Incorrect username or password'
//     });
//     return res.setHeader('Content-Type', 'text/html').status(400).send(html);
//   }

//   const session = await lucia.createSession(existingUser.id, {});
//   res
//     .appendHeader('Set-Cookie', lucia.createSessionCookie(session.id).serialize())
//     .appendHeader('Location', '/')
//     .redirect('/');
// });

router.post('/signout', (req, res) => {});

export default router;
