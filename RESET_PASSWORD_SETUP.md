# Password Reset Flow Setup & Deployment Guide

## Quick Start (Local Testing)

### 1. Setup locale (.env.local - già configurato)

Il filing `.env.local` è già aggiornato con:
```bash
NEXT_PUBLIC_STOREFRONT_DOMAIN=http://localhost:3000
```

### 2. Avvia il dev server

```bash
cd c:\Users\alfon\Desktop\Aurem
pnpm dev
```

Visita: http://localhost:3000

### 3. Test il flow di reset password

#### Step 1: Richiesta link
1. Vai a http://localhost:3000/login
2. Clicca "Forgot password?"
3. Inserisci un email registrata in Shopify (es. test@example.com che hai creato in Shopify)
4. Clicca "Send Link"

**Possibili risposte:**
- ✅ **Email registrata**: "Se l'indirizzo è registrato riceverai un link di reset via email."
- ❌ **Email non registrata**: "Questa email non è registrata nel nostro archivio."
- ❌ **Email malformata**: "Indirizzo email non valido."

#### Step 2: Ricevi email da Shopify

Controlla l'inbox del customer in Shopify Admin:
1. Shopify Admin > Customers > Seleziona il customer
2. Clicca sull'email di reset ricevuta
3. Il link conterrà: `http://localhost:3000/reset-password?token=https://auremcoats-store.myshopify.com/account/reset/...`

#### Step 3: Completa il reset

1. Copia il link dall'email
2. Visita il link nel browser (o cliccarci sopra)
3. Verifica che:
   - ✓ La pagina si carica con il form di reset
   - ✓ Validazione password in real-time
   - ✓ Pulsante "Aggiorna password" funziona
4. Inserisci nuova password (8+ chars, maiuscole, minuscole, numeri)
5. Clicca "Aggiorna password"

**Successo**: Reindirizza a `/login?success=reset` con messaggio di conferma

---

## Production Deployment

### Passo 1: Aggiorna il template email di Shopify

In **Shopify Admin > Settings > Emails > Customer password reset**:

Modifica il link del bottone da:
```liquid
<a href="{{ customer.reset_password_url }}" class="btn">Reset your password</a>
```

A:
```liquid
{%- assign reset_link = "https://www.auremthecoatsociety.com/reset-password?token=" | append: customer.reset_password_url -%}
<a href="{{ reset_link }}" class="btn">Reset your password</a>
```

**⚠️ IMPORTANTE**: Sostituisci `https://www.auremthecoatsociety.com` con il tuo dominio effettivo!

### Passo 2: Configura Vercel Environment Variables

Nel dashboard Vercel del progetto:

1. Vai a **Settings > Environment Variables**
2. Aggiungi o aggiorna:
   ```
   NEXT_PUBLIC_STOREFRONT_DOMAIN=https://www.auremthecoatsociety.com
   ```
3. Seleziona: Production, Preview, Development (tutti)
4. Clicca "Save"

Le altre variabili (SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN, etc.) rimangono invariate.

### Passo 3: Deploy a Vercel

```bash
git add .
git commit -m "feat: implement headless password reset with email verification"
git push origin main
```

Vercel auto-deploya. Aspetta che il deploy sia completo.

### Passo 4: Test in produzione

1. Vai a https://www.auremthecoatsociety.com/login
2. Clicca "Forgot password?"
3. Inserisci un'email registrata
4. Critica il tasto "Send Link"
5. Controlla l'inbox e clicca il link nell'email
6. Verifica che il link reindirizza a `https://www.auremthecoatsociety.com/reset-password?token=...`
7. Completa il reset

---

## Checklist Pre-Production

- [ ] Template email Shopify aggiornato con il dominio corretto
- [ ] NEXT_PUBLIC_STOREFRONT_DOMAIN configurato in Vercel
- [ ] Deploy completato su Vercel
- [ ] Test locale completato con token reali
- [ ] Test end-to-end in staging/produzione
- [ ] Rate limiting funzionante (max 3 richieste per 15 min per IP)
- [ ] Error messages chiare e user-friendly
- [ ] Password validation funziona (8+ chars, maiuscole, minuscole, numeri)
- [ ] Success state redirect a login con messaggio

---

## Troubleshooting

### "Errore: EMAIL_NOT_FOUND"
- ✅ Comportamento atteso: l'email non è registrata in Shopify
- Soluzione: Usa un'email che hai registrato come customer in Shopify

### "Errore: Rate limit"
- Probabilmente hai probato troppo veloce (>5 tentativi in 15 min)
- Aspetta 15 minuti e riprova

### "Token di reset non valido / scaduto"
- Il link di reset di Shopify scade dopo 24 ore
- Richiedi un nuovo link

### "Password non accettata"
- Deve essere: minimo 8 caratteri, con maiuscole, minuscole e numeri
- Esempio OK: `Aurem2026Coat!`

### Link email non contiene il dominio corretto
- Verifica che il template email di Shopify sia stato aggiornato
- Verifica che NEXT_PUBLIC_STOREFRONT_DOMAIN sia corretto in Vercel
- Aspetta 5-10 minuti e riprova l'email di reset

---

## Technical Details

### File Modificati
- `app/reset-password/page.tsx` - Frontend form for password reset
- `app/api/auth/reset-password/confirm/route.ts` - Backend endpoint to confirm reset
- `app/api/auth/reset/route.ts` - Updated to check if email exists (uses Admin API)
- `components/account/auth-context.tsx` - Updated to handle reset success message
- `components/account/login-form.tsx` - Added mode parameter support & success handling
- `lib/auth/password-reset.ts` - Token validation utilities
- `lib/auth/reset-password-config.ts` - Environment configuration
- `.env.local` - Updated with NEXT_PUBLIC_STOREFRONT_DOMAIN

### New Features
1. Email verification before sending reset link
2. Clear error messages for unregistered emails
3. Production-ready form with inline validation
4. Success state with auto-redirect to login
5. Expired token handling
6. Rate limiting per IP+token combination
7. Brand-aligned UI (AUREM aesthetic)

### Security Features
- Shopify still generates and validates reset tokens
- No custom token system
- Rate limited to prevent abuse
- No password logging
- HTTPS enforced in production
- Token expires after 24 hours (Shopify default)

---

## Support

For issues or questions:
1. Check error messages and troubleshooting section above
2. Verify all environment variables are set correctly
3. Check Vercel deployment logs for backend errors
4. Check browser console (F12) for frontend errors
5. Test with a fresh Shopify customer account (create one in Shopify Admin)
