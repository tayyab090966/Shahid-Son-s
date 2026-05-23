# Firebase Security Rules Specification

This document defines the zero-trust data invariants, validation rules, and threat vectors against malicious writes for the Shahid & Sons Cashbook Ledger.

## 1. Zero-Trust Data Invariants

1. **User Identity Isolation**: A user can only access and modify their own `/users/{userId}` profile, `/users/{userId}/transactions/{transactionId}` documents, and `/users/{userId}/books/{bookId}` documents. Under no circumstance can custom transactions/books be accessed by another user.
2. **Key Sufficiency & Shadows**:
   - Creating a transaction require exact keys: `id`, `title`, `book`, `amount`, `isIncome`, `date`, `userId`, `createdAt`, `updatedAt`.
   - Creating a book requires: `name`, `userId`, `createdAt`.
3. **Type and Boundary Enforcement**:
   - `amount` must be a positive number.
   - `title` must be a string up to 128 characters.
   - `book` must be a string up to 64 characters.
4. **Email and State Integrity**: Custom roles are not supported in this app. Email verification checks can be skipped for anonymous or google accounts, but if requested, we explicitly require `request.auth.token.email_verified == true` for writing critical configurations.
5. **No Client-Side Timestamps**: `createdAt` and `updatedAt` must match the server timestamp (`request.time`).

---

## 2. The "Dirty Dozen" Threat Payloads (Blocked)

Below are the 12 hypothetical payloads designed to break our database logic, which will be strictly blocked by our rules:

1. **Spoofed User Creation**: A user with UID `A` attempting to write a profile at `/users/B`.
2. **Transaction Hijacking**: User `A` tries to write a transaction document at `/users/B/transactions/tx-1`.
3. **Ghost Fields (Shadow Fields)**: Attempting to save a transaction with an unrequested field like `secretAdminPrivilege: true`.
4. **Missing Required Fields**: Attempting to create a transaction without the `amount` property.
5. **Negative Amount Poisoning**: Attempting to write a transaction where `amount = -500`.
6. **Type Mismatch Hack**: Sending `isIncome: "true"` (string) instead of a boolean value.
7. **Client Time-Fudging**: Setting a custom or future `createdAt` value (e.g. year `2035`) instead of `request.time`.
8. **Immutability Bypass**: Altering the `createdAt` value of a transaction during an update.
9. **User Identity Pivot**: Updating a transaction's `userId` from `A` to `B` to transfer ownership.
10. **Book Name Injection**: Injecting a massive 1MB string as a ledger book name.
11. **Malicious Path Variable ID Injection**: Using a long custom ID with special characters like `/../secrets` as `transactionId` in client SDK calls.
12. **Out of Boundary Fields**: Attempting to write a ledger transaction title that contains over 50,000 characters.

---

## 3. Test Coverage Strategy

All our "Dirty Dozen" scenarios are caught by compiling strict global helper validations inside the Firestore rules described in `/firestore.rules`.
