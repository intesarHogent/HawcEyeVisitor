📘 Hawc Eye Visitor – README
🧩 Overzicht

Hawc Eye Visitor is een mobiele applicatie (Expo React Native) voor het reserveren van bedrijfsresources zoals vergaderruimtes, auto’s en parkeerplaatsen.
De applicatie ondersteunt directe betalingen via Mollie, achteraf betalen via factuur (na administratieve goedkeuring) en automatische e-mailnotificaties via Resend.

De backend is opgebouwd met Vercel Serverless Functions, terwijl Firebase Authentication en Firestore worden gebruikt voor authenticatie en dataopslag.

📱 Functionaliteiten
🔐 Authenticatie

Inloggen en registreren via Firebase Authentication

Ondersteuning voor:

Standaard gebruikers

Professionele gebruikers

Administrators

Automatische sessieherstelling

🧑‍💼 Gebruikerstypes & Rechten
Standard user

Enkel directe betaling via Mollie

Professional user

Directe betaling via Mollie

Achteraf betalen via factuur na administratieve goedkeuring

Admin

Volledige toegang

Factuurbetalingen altijd toegestaan

Beheer van factuurgoedkeuringen

De administratieve functionaliteiten dienen ter ondersteuning van de gebruikersflow en zijn niet het hoofdfocuspunt van dit project.

🧾 Factuurgoedkeuring

Professionele gebruikers kunnen een factuuraanvraag indienen

Status wordt opgeslagen in Firestore (invoiceApproval):

pending

approved

rejected

Administrators kunnen aanvragen goedkeuren of weigeren

De betalingsflow past zich automatisch aan op basis van deze status

🗓️ Reserveringen

Selectie van datum en tijd

Conflict-controle via Firestore

Reservaties worden opgeslagen in Firestore

Redux draft-systeem:

Draft blijft bestaan tot betaling of factuur

Draft wordt verwijderd na succesvolle afronding

💳 Betalingen
1. Directe betaling (Mollie)

Start via /api/create-payment

Betaling via WebView

Mollie callback verwerkt door backend

Bevestigingsmail via Resend

Reservatie opgeslagen in Firestore

2. Betaling via factuur

Enkel voor professionele gebruikers

Alleen beschikbaar wanneer invoiceApproval === "approved"

Backend verstuurt factuurbevestiging via Resend

Reservatie wordt opgeslagen zonder Mollie-betaling

📧 E-mailnotificaties (Resend)

Bevestiging bij Mollie-betaling

Bevestiging bij factuurreservatie

Logs en verbruik zichtbaar in het Resend-dashboard

Gratis plan: 3000 e-mails / maand

🗄️ Firestore Structuur
📂 Collectie: users
uid
 ├─ fullName
 ├─ email
 ├─ userType: "standard" | "professional" | "admin"
 ├─ companyName
 ├─ vat
 └─ invoiceApproval: "none" | "pending" | "approved" | "rejected"

📂 Collectie: bookings
resourceId
resourceName
type
location
start (ISO)
end (ISO)
total
paymentMethod: "mollie" | "invoice"
userId
userEmail
createdAt

🔥 Backend (Vercel Serverless Functions)
📂 Structuur
hawc-payments-backend/
 ├─ api/
 │   ├─ create-payment.js
 │   ├─ payment-status.js
 │   ├─ payment-complete.js
 │   └─ create-invoice-booking.js
 └─ vercel.json

📌 Endpoints
Endpoint	Beschrijving
/api/create-payment	Start Mollie betaling
/api/payment-status	Controleert betalingsstatus
/api/payment-complete	Mollie callback
/api/create-invoice-booking	Factuurmail versturen
🔧 Environment Variables
Backend (Vercel)
MOLLIE_API_KEY=
RESEND_API_KEY=
TEST_EMAIL=

Mobiele applicatie
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_AUTH_DOMAIN=
FIREBASE_STORAGE_BUCKET=


API-sleutels worden beheerd via environment variables en zijn niet opgenomen in de repository.

🧠 Redux Draft Systeem
{
  type: "room" | "car" | "parking",
  byType: {
    room: { date, start, hours },
    car: { date, start, hours },
    parking: { date, start, hours }
  }
}


Na succesvolle boeking:

resetAll();

🚀 Installatie
npm install
npx expo start

🛠️ Backend lokaal testen
cd hawc-payments-backend
vercel dev

📤 Backend deployen
cd hawc-payments-backend
vercel --prod

💳 Betalingsflow (Samenvatting)
Directe betaling

App → /create-payment → Mollie Checkout → /payment-complete
→ Reservatie opgeslagen → E-mail verzonden → Draft verwijderd

Factuurbetaling

App → /create-invoice-booking → Factuurmail via Resend
→ Reservatie opgeslagen → Draft verwijderd

📦 App builden
eas build --platform android

✔️ Conclusie

Hawc Eye Visitor biedt:

een complete mobiele reservatie-oplossing

veilige betalingsmogelijkheden

administratief gestuurde facturatie

automatische e-mailnotificaties

een schaalbare serverless backend

duidelijke Firestore-datastructuur

sterke gebruikerservaring dankzij het draft-systeem

Geschikt voor bedrijfsgebruik én als Graduaatsproef.