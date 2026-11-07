# Example Collection
> Premier Indian Ethnic & Contemporary Clothing Ecommerce Platform

Handcrafted sarees (Banarasi, Kanjeevaram, Chanderi), Chikankari suits, royal bridal lehengas, and festive menswear with full integer paise currency calculations, ACID database transactions, secure authentication, and pan-India checkout.

---

## Why did you see `sh: tsx: command not found`?

When running `npm run dev` on a local machine (such as your MacBook Air), npm looks for `tsx` inside your local `./node_modules/.bin/` directory. If dependencies have not been installed yet, `tsx` is not found.

---

## How to Run on Localhost (Mac / Linux / Windows)

Open your terminal in the `krushna-collection` directory and run:

### Step 1: Install Dependencies
```bash
npm install
```
*(This installs `tsx`, `express`, `vite`, `react`, and all required packages into your local `node_modules`)*

If you ever see `tsx: command not found` again, you can install it directly:
```bash
npm install tsx
```

---

### Step 2: Set Up Environment Variables
Create your local `.env` file from the example:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
PORT=3000
NODE_ENV="development"
APP_URL="http://localhost:3000"
SESSION_SECRET="krushna_collection_secure_production_session_secret_key_9876543210"
```

---

### Step 3: Start the Development Server
```bash
npm run dev
```

You should see:
```
✨ Example Collection server running at http://0.0.0.0:3000
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser (Safari, Chrome, etc.).

---

### Step 4: Run Tests (Unit, Integration & E2E)
```bash
npm test
```
All 27 automated tests will run and report status.

---

### Step 5: Type Check & Lint
```bash
npm run lint
```

---

## Production Build
To create a production build and run it:
```bash
npm run build
npm start
```

---

## Key Features & Rules Implemented
- **Currency strictly in integer paise**: 1 INR = 100 paise; prevents floating point rounding errors in cart, coupons, and orders.
- **ACID Database Transactions**: Handled via Node.js SQLite with `BEGIN IMMEDIATE` and `ROLLBACK` on stock exhaustion.
- **Card Security (Rule 6)**: Raw card numbers and CVV are never accepted or stored.
- **Indian Payment Methods**: UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking, Tokenized RuPay/Visa, and Cash on Delivery.
- **Authentication**: Salted scrypt password hashing (`crypto.scryptSync`), dual login with Email or 10-digit Indian Mobile Number, and cross-session order persistence.
