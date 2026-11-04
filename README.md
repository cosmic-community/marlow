# Marlow

Vacation rentals and a guest portal for Sonoma County. The chat and the CAP door are Leo, the Cosmic support agent. Guests and stays are Cosmic objects, and login is what lets Leo read one guest's reservation.

## Run

```bash
cp .env.example .env
bun install
bun run seed
bun run check
bun run dev
```

Open http://localhost:3220. Ask Leo at http://localhost:3220/chat. `agent.txt` points CAP and OAuth at this site. Public house questions are sent to Leo. Account questions stay here and require a login.

The chat only answers if this origin is on Leo's allowed websites. For local work that is `http://localhost:3220`.

Demo guests: `maya` / `maya` and `sam` / `sam`. Maya is at Orchard House. Sam is at Cliff Kitchen. `bun run reset` puts both demo stays back to confirmed, without noon checkout or an extra night, in Cosmic and in the local `data/bookings.json` fallback. Dates are counted from the day they were saved.

`bun run seed` writes the houses, the fee and cancellation pages, the two guests, their stays, and the `cap-records` type into the Cosmic bucket named by `COSMIC_BUCKET_SLUG`. Arrival instructions are stored on the stay, not on the public house. The site reads those houses when the read key is set, and uses the copy in the repo if the bucket cannot be reached.

`bun run check` covers search, fees, and the guest portal. It does not call Leo.

## Door

`/agent.txt` names Leo and publishes this site's CAP and OAuth URLs. `CAP_PUBLIC_KEY` is the `ck_` key used to ask Leo public questions. `NEXT_PUBLIC_CHAT_EMBED_KEY` is the `pk_` key from his website install.

With the bucket keys set, the door keeps its logins, tokens, messages, and approvals as `cap-records` objects in Cosmic, so it runs on serverless hosting. Without them it uses `data/cap.sqlite`.

Leo reads and changes stays through `/api/account/stays`. In his website install, set the account base URL to `<site>/api/account` and add these endpoints:

| Name | Method | Path |
| --- | --- | --- |
| `list_stays` | GET | `/stays` |
| `get_stay` | GET | `/stays/:id` |
| `noon_checkout` | POST | `/stays/:id/noon-checkout` |
| `extend_stay` | POST | `/stays/:id/extend` |
| `cancel_stay` | POST | `/stays/:id/cancel` |

## Deploy on Vercel

Import the repo, then set every variable in `.env.example`. `NEXT_PUBLIC_SITE_URL` is the production origin, and `SESSION_SECRET` is a new random value (`openssl rand -base64 32`); the site refuses to sign sessions in production without it. Run `bun run seed` once against the bucket, add the production origin to Leo's allowed websites, and point his account base URL at it.
