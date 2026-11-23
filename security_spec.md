# Firestore Security Specification — TopUp Hub Lanka

## 1. Data Invariants
1. **User Profile Ownership & PII Isolation**: A `/users/{userId}` document can only be read or created/updated by the authenticated verified user matching `userId`, or by a verified store administrator registered in `/admins/{uid}` (`email_verified == true`). Self-profile updates cannot tamper with `uid` or `createdAt`.
2. **Saved Player UIDs Master Gate**: A `/users/{userId}/savedUids/{savedUidId}` document cannot be created or updated unless the parent `/users/{userId}` profile document exists and `request.auth.uid == userId == incoming().userId`.
3. **Order Integrity & Status Locking**: A `/orders/{orderId}` document must have `userId == request.auth.uid`, valid `orderId` matching `^#?ORD-[0-9]{4,12}$`, positive `amountLKR`/`totalPaidLKR`, and `status == 'pending_verification'` on creation. Only the verified store owner can transition an order to `'completed'` or `'rejected'`, and once `'completed'` or `'rejected'`, non-admin users cannot modify the order.
4. **Temporal & Volumetric Bounds**: All `createdAt` and `updatedAt` timestamps must equal `request.time`. Every string and enum matches `firebase-blueprint.json` constraints.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read/write to `/users/{uid}` or `/orders/{orderId}`.
2. Spoofed user profile creation with `uid: "other-user"` under `/users/{myUid}`.
3. Oversized `name` (> 120 chars) or shadow field `isAdmin: true` in `/users/{myUid}`.
4. Unverified email user (`email_verified: false`) attempting to create an order or profile.
5. Client attempting to forge admin access or spoof `/admins/{uid}` without an authoritative admin record.
6. Creating an order directly with `status: "completed"` instead of `"pending_verification"`.
7. Creating an order with `amountLKR: -100` or `totalPaidLKR: 0`.
8. Non-owner user attempting to update `status` to `"completed"` on `/orders/{orderId}`.
9. Non-owner attempting to read or `list` `/orders` without filtering to `userId == request.auth.uid`.
10. Modifying immutable `createdAt` or `userId` during `/orders/{orderId}` or `/users/{uid}` update.
11. Creating `/users/{uid}/savedUids/{id}` when parent `/users/{uid}` document does not exist.
12. Document ID poisoning (1,500-char doc ID or special characters) on `/orders/{orderId}` or `/users/{userId}`.
