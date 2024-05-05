import { Router, type Request, type Response } from 'express';
import { Argon2id } from 'oslo/password';

import { lucia } from '../lib/auth.js';
import { isValidUsername, isValidPassword } from '../utils/validation.js';
import {
    type User,
    createUser,
    getUserByUsername,
    getUserByEmail,
} from '../lib/users.js';
import { sendEmail } from '../lib/email.js';

const router = Router();

router.post('/signup', async (req: Request, res: Response) => {
    // console.log(req.body);
    const username: string | null = req.body.username ?? null;
    if (!username || !isValidUsername(username))
        return res.status(400).json({ error: `Illegal username` });

    const password: string | null = req.body.password ?? null;
    if (!password || !isValidPassword(password))
        return res.status(400).json({ error: `Illegal password` });

    console.log(
        await sendEmail({
            to: 'sgharr304@gmail.com',
            subject: 'THIS IS A TEST',
            text: 'Sam\n\nhere is some more text\n\n',
        }),
    );
    return res.end();

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
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
        };
        const dbRes = await createUser(newUser);
        const userId = dbRes.rows[0]?.id;
        const session = await lucia.createSession(userId, {});
        return res
            .appendHeader(
                'Set-Cookie',
                lucia.createSessionCookie(session.id).serialize(),
            )
            .status(200)
            .end();
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
