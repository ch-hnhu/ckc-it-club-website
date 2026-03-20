import path from "path";
import dotenv from "dotenv";

const express: any = require("express");
const { createServer: createViteServer }: any = require("vite");
const session: any = require("express-session");
const { OAuth2Client }: any = require("google-auth-library");

dotenv.config();

const app = express();
const PORT = 3000;

// Google OAuth Setup
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
const redirectUri = `${appUrl.replace(/\/$/, "")}/auth/google/callback`;

const oauth2Client = new OAuth2Client(clientID, clientSecret, redirectUri);

app.use(express.json());
app.use(
  session({
    secret: "google-auth-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
    },
  })
);

// API Routes
app.get("/api/auth/google/url", (_req: any, res: any) => {
  if (!clientID || !clientSecret) {
    return res.status(500).json({ error: "Google OAuth credentials not configured" });
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });
  res.json({ url });
});

app.get("/auth/google/callback", async (req: any, res: any) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: clientID,
    });
    const payload = ticket.getPayload();

    // Store user in session
    req.session.user = {
      id: payload?.sub,
      email: payload?.email,
      name: payload?.name,
      picture: payload?.picture,
    };

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Dang nhap thanh cong! Cua so nay se tu dong dong.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error during Google Auth callback:", error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/user", (req: any, res: any) => {
  const user = req.session.user;
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

app.post("/api/logout", (req: any, res: any) => {
  req.session.destroy((err: unknown) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.json({ message: "Logged out" });
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req: any, res: any) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
