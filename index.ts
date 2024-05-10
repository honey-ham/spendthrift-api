import express, { Express, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
// import { verifyRequestOrigin } from 'lucia';

import accountRouter from './routes/account.js';
import unknownAccountRouter from './routes/unknown-account.js';
import { getEnv } from './utils/misc.js';
import { lucia } from './lib/auth.js';

dotenv.config();

const app: Express = express();
app.use(express.json());
app.use(cookieParser(getEnv('COOKIE_SECRET')));

const port = getEnv('PORT') || 3000;

// Something to prevent CSRF written in the lucia docs
// app.use((req, res, next) => {
// 	if (req.method === "GET") {
// 		return next();
// 	}
// 	const originHeader = req.headers.origin ?? null;
// 	// NOTE: You may need to use `X-Forwarded-Host` instead
// 	const hostHeader = req.headers.host ?? null;
// 	if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
// 		return res.status(403).end();
// 	}
// });

// Handles sign-in and sign-up
app.use('/', unknownAccountRouter);

app.use(async (req: Request, res: Response, next) => {
    // Checking for session cookie
    const sessionId = req.signedCookies.auth_session;
    if (!sessionId)
        return res.status(401).json({ error: 'No user is logged in' });

    // Checking for valid session then updating/killing session if necessary
    const { session, user } = await lucia.validateSession(sessionId);
    if (session && session.fresh) {
        const newCookie = lucia.createSessionCookie(session.id);
        res.cookie(newCookie.name, newCookie.value, {
            ...newCookie.attributes,
            signed: true,
        });
    } else if (!session) {
        const blankCookie = lucia.createBlankSessionCookie();
        return res
            .status(401)
            .cookie(blankCookie.name, blankCookie.value, blankCookie.attributes)
            .json({ error: 'No user is logged in' });
    }

    // User Id & session object will accessible from all endpoints that occur after this
    res.locals.userId = user.id;
    res.locals.session = session;
    return next();
});

app.use('/', accountRouter);

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
