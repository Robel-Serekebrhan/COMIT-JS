const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch {}

// v2 function: when a booking becomes confirmed, decline other pending copies
exports.onBookingConfirmed = onDocumentUpdated(
  { document: 'bookings/{bookingId}', region: 'us-central1' },
  async (event) => {
    const before = event.data?.before?.data?.() || {};
    const after = event.data?.after?.data?.() || {};

    if (!before || !after) return;
    if (before.status === 'confirmed' || after.status !== 'confirmed') return; // not a new confirm

    const groupId = after.requestGroupId;
    if (!groupId) return;

    const db = admin.firestore();
    const q = db
      .collection('bookings')
      .where('requestGroupId', '==', groupId)
      .where('status', '==', 'pending');

    const snap = await q.get();
    if (snap.empty) return;

    const batch = db.batch();
    snap.docs.forEach((docSnap) => {
      if (docSnap.id === event.params.bookingId) return; // skip self
      batch.update(docSnap.ref, {
        status: 'declined',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    logger.info('Auto-declined other pending bookings', { groupId, count: snap.size - 1 });
  }
);
