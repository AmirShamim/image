# Day 2 & 3: Middleware, Authentication, and Databases

Today we learn how servers protect themselves and remember things, using `middleware/` and `database-pg.js`.

## Concept 1: Middleware (The Bouncers)
A server cannot just let anyone upload a 50GB file. It needs bouncers. In Express.js, these are called **Middleware**. They execute *in the middle* of receiving a request and processing it.

Look at your folder: `middleware/auth.js`, `middleware/queue.js`, `middleware/rateLimiters.js`.

1.  **Rate Limiter:** Acts as a security guard. If the same user asks for an upscale 100 times in 1 minute, the rate-limiter immediately returns a `429 Too Many Requests` error to protect against DDoS (Distributed Denial of Service) attacks.
2.  **Auth (JSON Web Tokens - JWT):**
    *   HTTP is "Stateless". It has amnesia. Every time you click a button, the server forgets who you are.
    *   To fix this, when a user logs in, `routes/auth.js` queries `database-pg.js`. If the password matches, the server signs a cryptographic text string (the JWT) and gives it to the user.
    *   For future uploads, React puts this JWT in the request. The `auth.js` middleware mathematically verifies it. If it's fake, it blocks the request.

## Concept 2: The Database (Neon Postgres)
In `database-pg.js`, you connect to a PostgreSQL database.

*   **Relational vs NoSQL:** Postgres is relational. It uses structured tables. 
*   **The Flow:** When an image is processed, your backend creates a log. It uses an SQL `INSERT INTO` command to save the `user_id`, the `original_url`, and the `upscaled_url`.
*   **Why we do this:** Without a database, if your Node.js server restarts, all user accounts, billing info, and history disappear. The database provides **Persistent State**.

### Study Action:
Open `middleware/auth.js`. Look at how it extracts the token from the `req.headers.authorization`. If the token is missing, observe how it reacts. Next, review `database-pg.js` and trace how a connection is established using the database connection URL.

**Viva Question to Answer:** "How does your system know a user is allowed to use the Pro model?"
*Answer:* "When the client connects, they pass a JWT token. My `auth` middleware intercepts the request, validates the cryptographic signature, and attaches the user's Tier (saved in my Postgres database) to the request object. If they don't have the Pro tier, the server rejects the request with a 403 Forbidden before the image ever hits the GPU."