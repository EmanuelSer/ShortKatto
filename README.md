# ShortKatto Static MVP

Structure
- index.html — marketing site (hero, steps, benefits, plans, FAQs)
- dashboard.html — gated client dashboard (Firebase Auth)
- assets/css/styles.css — styles
- assets/js/main.js — front-end behavior + config (Calendly link, Stripe links, availability flags)
- assets/js/dashboard.js — login, Firestore read, pause/cancel requests
- firebase-config/firebase-init.js — Firebase SDK init (fill with your project keys)

How to use
1) Fill config
   - Edit assets/js/main.js
     - calendlyUrl: your Calendly booking link
     - stripe.basic and stripe.pro: your Stripe Payment Links
     - availability flags: 'available' | 'unavailable' (purely cosmetic)
   - Edit firebase-config/firebase-init.js with your Firebase project config.

2) Deploy to GitHub Pages
   - Commit this folder to a GitHub repo and enable Pages on the main branch, root folder.

3) Firestore data model
   Collection: clients
   Document ID: the customer's email in lowercase (recommended for Zapier mapping)
   Sample fields:
   {
     "email": "john@doe.com",
     "plan": "basic",
     "status": "active",                 // or "trialing", "past_due", "canceled", "paused"
     "trello_board_url": "https://trello.com/b/...",
     "dropbox_folder_url": "https://www.dropbox.com/home/...",
     "dropbox_request_url": "https://www.dropbox.com/request/...",
     "stripe_customer_id": "cus_123",
     "created_at": 1690000000000,        // ms epoch
     "updated_at": 1690000100000
   }

4) Firebase Security Rules (Firestore)
   Use document IDs that equal the user's auth email (lowercased). Then apply rules:
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /clients/{docId} {
         allow read, update, delete: if request.auth != null &&
           request.auth.token.email != null &&
           request.auth.token.email.toLowerCase() == docId;
         allow create: if true; // let Zapier create records without auth using your server key
       }
     }
   }
   IMPORTANT: If Zapier writes directly, use a restricted service account key or a Firebase Extension/Callable; otherwise prefer a Firestore REST API key in Zapier with security via rules or a Cloud Function proxy. For MVP, consider using the 'Firebase Admin' app connection inside Zapier which authenticates securely.

5) Zapier setup (blueprint)
   Zap A — On successful Stripe payment
   - Trigger: Stripe — Payment successful (Checkout Session Completed)
   - Actions:
     - Formatter — normalize buyer email to lowercase
     - Trello — Create board (from template)
     - Dropbox — Create folder ("Name + Tier") and File Request
     - Firebase / Firestore — Create/Update Document
       - Collection: clients
       - Document ID: lowercased email
       - Set fields: plan, status="active", trello_board_url, dropbox_folder_url, dropbox_request_url, stripe_customer_id, updated_at
     - Email by Zapier — Send welcome email with the three links

   Zap B — Subscription updates
   - Trigger: Stripe — Subscription updated
   - Action: Firestore — Update the client's document: status (active, past_due, canceled, paused)

   Zap C — Billing portal request (optional)
   - Trigger: Webhooks by Zapier — Catch Hook
   - Actions:
     - Stripe — Find Customer by email
     - Stripe — Create Billing Portal Session
     - Email by Zapier — Send the portal URL to the email from the hook
     - Optionally, Firestore — Update the client's doc with last_portal_email_at

   Paste the Catch Hook URL into assets/js/dashboard.js (ZAP_WEBHOOK_URL).

6) Pause/Cancel buttons
   The dashboard buttons call ZAP_WEBHOOK_URL with payload: {action: 'pause'|'cancel'|'portal', email, uid, ts}.
   Your Zap should:
     - Find the Stripe subscription for that customer
     - Pause collection or cancel at period end
     - Email confirmation and/or portal link

7) Notes
   - Ensure customers log in with the same email used at checkout.
   - Data propagation from Stripe → Zapier → Firestore may take up to a few minutes.
   - If a client logs in before Zap runs, dashboard will show 'provisioning' until links are saved.

Local preview
You can open index.html directly, or run a simple server (e.g., VS Code Live Server) to test navigation.

