# Security Specification: NutriLife AI

## 1. Data Invariants
- A user can only access their own profile.
- Meals, Expenses, and AI Plans must belong to the logged-in user.
- Budget values must be positive numbers.
- Timestamps for creation must match server time.

## 2. The "Dirty Dozen" Payloads (Deny Cases)

1. **Identity Spoofing**: Attempt to create a user profile with a UID that doesn't match `request.auth.uid`.
2. **Ghost Field Injection**: Adding `isAdmin: true` to a user profile update.
3. **Cross-User Data Scraping**: Authenticated User A attempts to list User B's expenses.
4. **Negative Budget**: Setting `dailyBudget` to `-100`.
5. **Orphaned Expense**: User A attempts to create an expense in User B's subcollection.
6. **Future Date Injection**: Setting `createdAt` to a point in the future.
7. **Role Escalation**: Attempting to update a document in a non-existent `admins` collection to give self admin rights.
8. **Resource Exhaustion**: Sending a 1MB string into the `fullName` field.
9. **ID Poisoning**: Using a 1.5KB junk string as a document ID.
10. **Terminal State Bypass**: Changing a read-only historical AI plan result.
11. **Email Spoofing**: Changing email in user profile without verifying it (if verified email rule is active).
12. **Anonymous Write**: Attempting to write a budget without being signed in.

## 3. Test Runner (Conceptual)
All the above payloads should return `PERMISSION_DENIED` in a suite running `firebase-fast-rules` or similar test runner.
