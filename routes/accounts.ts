import { Router, type Request, type Response } from 'express';

import { lucia } from '../lib/auth.js';
import { verifyUser, getUserById } from '../lib/users.js';
import { sendVerificationEmail } from '../lib/email.js';

const router = Router();

router.post('/verifyEmail/:userId', async (req: Request, res: Response) => {
    if (!req.cookies.auth_session)
        res.status(401).json({ error: 'No user was logged in' });
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
        // If no cookie no one was logged in
        if (!req.cookies.auth_session)
            return res.status(401).json({ error: 'No user was logged in' });

        const id = req.params.userId ?? null;
        if (!id)
            return res
                .status(400)
                .json({ error: 'Unable to send verification email' });

        const { session, user: sessionUser } = await lucia.validateSession(
            req.cookies.auth_session,
        );
        // Intentionally not sending 401 so the person is able to keep guessing ids
        if (sessionUser?.id !== id)
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

router.post('/signout', async (req, res) => {
    console.log(res.locals);
    if (!req.signedCookies.auth_session)
        return res.status(401).json({ message: 'No user was signed in' });
    await lucia.invalidateSession(req.signedCookies.auth_session);
    const cookie = lucia.createBlankSessionCookie();
    console.log(cookie);
    return res
        .status(200)
        .cookie(cookie.name, cookie.value, cookie.attributes)
        .json({ message: 'Sign-out successful' });
});

export default router;
