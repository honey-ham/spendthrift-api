import express, { Express, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
// import { verifyRequestOrigin } from 'lucia';

import unknownAccountRouter from './routes/unknown-account.js';
import accountRouter from './routes/account.js';
import purchaseRouter from './routes/purchase.js';
import { getEnv } from './utils/misc.js';
import { lucia } from './lib/auth.js';
import { getUserPermissions, getUserById, Permissions } from './lib/user.js';
import swaggerDocument from './docs/openapi.json' with { type: 'json' };

dotenv.config();

const app: Express = express();
app.use(express.json());
app.use(cookieParser(getEnv('COOKIE_SECRET')));

const port = getEnv('PORT') || 3000;
const version = getEnv('VERSION');
const versionString = `v${version}`;

// Swagger setup (API documentation)
app.use(
  `/${versionString}/docs`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument),
);

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
app.use(`/${versionString}/`, unknownAccountRouter);

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

  // user const above contains only id so grabbing all fields
  const fullUser = await getUserById(user.id);
  const permissions = await getUserPermissions(user.id);
  if (!fullUser || !permissions)
    return res.status(500).json({ error: 'Unable to find user' });

  // Below fields will be accessible from any endpoint initialized after this middleware
  res.locals.userId = fullUser.id;
  res.locals.isSuperuser = permissions.name === Permissions.Superuser;
  res.locals.isLocked = fullUser.isLocked;
  res.locals.isVerified = fullUser.isVerified;
  res.locals.session = session;
  return next();
});

app.use(`/${versionString}/`, accountRouter);
app.use(`/${versionString}/`, purchaseRouter);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
