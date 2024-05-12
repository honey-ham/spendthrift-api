/**
 * Holds endpoints related to accounts where the caller IS authenticated
 * Things like sign-out & verify email
 */

import { Router, type Request, type Response } from 'express';

import { lucia } from '../lib/auth.js';
import {
    verifyUser,
    getUserById,
    setVerificationAttemptDate,
    getUserPermissions,
} from '../lib/user.js';
import { sendVerificationEmail } from '../lib/email.js';
import { msSinceDate } from '../utils/misc.js';

const router = Router();

router.post('/verifyEmail/:userId?', async (req: Request, res: Response) => {
    const id = req.params.userId ?? res.locals.userId;

    if (
        !res.locals.isSuperuser &&
        req.params.userId &&
        res.locals.userId !== req.params.userId
    )
        return res
            .status(401)
            .json({ error: 'You cannot verify another users account' });

    const isUserVerified = await verifyUser(id);
    if (isUserVerified)
        return res.status(200).json({
            message: "User's email was successfully verified",
        });
    return res.status(500).json({ error: 'Unable to verify email' });
});

router.post(
    '/resendVerificationEmail/:userId?',
    async (req: Request, res: Response) => {
        const id = req.params.userId ?? res.locals.userId;

        if (
            !res.locals.isSuperuser &&
            req.params.userId &&
            res.locals.userId !== req.params.userId
        )
            return res
                .status(401)
                .json({ error: 'You cannot verify another users account' });

        const user = await getUserById(id);
        if (user === null)
            return res
                .status(400)
                .json({ error: 'Unable to send verification email' });
        else if (user.isVerified)
            return res.status(403).json({ error: 'You are already verified' });
        else if (user.lastVerificationAttempt !== null) {
            const ms = msSinceDate(user.lastVerificationAttempt);
            if (ms <= 300000)
                return res.status(403).json({
                    error: `You cannot send another email verification for another ${(300000 - ms) / 1000}s`,
                });
        } else if (
            (await sendVerificationEmail({
                to: user.email,
                firstName: user.firstName,
                userId: id,
            })) === null
        )
            return res
                .status(500)
                .json({ error: 'Unable to send verification email' });
        else {
            await setVerificationAttemptDate(user.id);
            return res.status(200).json({ message: 'Sent verification email' });
        }
    },
);

router.post('/signout', async (req: Request, res: Response) => {
    await lucia.invalidateSession(req.signedCookies.auth_session);
    const cookie = lucia.createBlankSessionCookie();
    return res
        .status(200)
        .cookie(cookie.name, cookie.value, cookie.attributes)
        .json({ message: 'Sign-out successful' });
});

router.get('/permissions/:userId?', async (req: Request, res: Response) => {
    const id = req.params.userId ?? res.locals.userId;

    if (
        !res.locals.isSuperuser &&
        req.params.userId &&
        res.locals.userId !== req.params.userId
    )
        return res
            .status(401)
            .json({ error: 'You cannot get another users permissions' });

    const dbRes = await getUserPermissions(id);
    if (!dbRes)
        return res
            .status(500)
            .json({ error: 'Unable to get permissions for user' });
    return res.status(200).json({ data: dbRes });
});

export default router;
