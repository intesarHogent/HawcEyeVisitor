📘 HawcEye Visitor – README
🧩 Overzicht

Hawc Visitor is een mobiele applicatie (Expo React Native) voor het reserveren van bedrijfsresources zoals vergaderruimtes, auto’s en parkeerplaatsen.
De app ondersteunt online betalingen via Mollie, achteraf betalen via factuur (met admin-goedkeuring) en automatische e-mailnotificaties via Resend.
De backend draait op Vercel Serverless Functions, met Firebase Authentication + Firestore voor dataopslag.

📱 Functionaliteiten
🔐 Authenticatie

Inloggen / registreren via Firebase Authentication

Ondersteuning voor:

Standaard gebruikers

Professionele gebruikers

Admin

Automatische sessieherstelling

🧑‍💼 Gebruikerstypes & Rechten

Standard user

Enkel online betalen (Mollie)

Professional user

Online betalen (Mollie)

Achteraf betalen via factuur na goedkeuring door admin

Admin

Volledige toegang

Factuurbetalingen altijd toegestaan

Beheer van factuurgoedkeuringen

🧾 Factuurgoedkeuring (Nieuw)

Professionele gebruikers kunnen een factuuraanvraag indienen

Status wordt opgeslagen in Firestore (invoiceApproval)

pending

approved

rejected

Admin Invoice Screen

Overzicht van alle pending factuuraanvragen

Mogelijkheid om aanvragen goed te keuren of te weigeren

De Payment-flow past zich automatisch aan op basis van deze status

🗓️ Reserveringen

Datum en tijd selecteren

Conflict-check via Firestore

Bookings worden opgeslagen in Firestore

Redux draft-systeem

Draft blijft bestaan tot betaling of factuur

Draft wordt gewist na succesvolle afronding

💳 Betalingen
1. Online betaling (Mollie)

Start via /api/create-payment

Betaling via WebView

Mollie callback verwerkt door backend

Bevestigingsmail via Resend

Booking opgeslagen in Firestore

2. Achteraf betalen (Factuur)

Enkel voor professionele gebruikers

Alleen beschikbaar bij invoiceApproval === "approved"

Backend stuurt factuurnotificatie via Resend

App slaat booking op

Geen Mollie-betaling vereist

📧 E-mailnotificaties (Resend)

Bevestiging bij Mollie-betaling

Bevestiging bij factuurboeking

Logs en verbruik zichtbaar in Resend dashboard

🗄️ Firestore Structuur
📂 Collectie: users
uid
  fullName
  email
  userType: "standard" | "professional" | "admin"
  companyName
  vat
  invoiceApproval: "none" | "pending" | "approved" | "rejected"

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
  api/
    create-payment.js
    payment-status.js
    payment-complete.js
    create-invoice-booking.js
  vercel.json

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

Mobiele app
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_AUTH_DOMAIN=
FIREBASE_STORAGE_BUCKET=

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

resetAll()

🚀 Installatie
npm install
npx expo start

🛠️ Backend lokaal testen
cd hawc-payments-backend
vercel dev

📤 Backend deployen
cd hawc-payments-backend
vercel --prod

📈 Resend – Verbruik

Dashboard:
https://resend.com/dashboard
 → Usage

Verzonden e-mails

Resterende quota

Logs per e-mail
Gratis plan: 3000 e-mails / maand

💳 Betalingsflow (Samenvatting)
Online betaling

App → /create-payment

Mollie Checkout

Callback → /payment-complete

Booking opgeslagen

E-mail verzonden

Draft gewist

Navigatie → BookingSuccess

Factuur (“Pay later”)

App → /create-invoice-booking

Factuurmail via Resend

Booking opgeslagen

Draft gewist

Navigatie → MyBookings

📦 App builden
eas build --platform android

✔️ Conclusie

Hawc Visitor biedt:

een complete reservatie-oplossing

veilige online betalingen

admin-gestuurde facturatie

automatische e-mailnotificaties

schaalbare Vercel backend

Firestore data-opslag

sterke UX met draft-systeem

Geschikt voor bedrijfsgebruik én als Graduaatsproef.