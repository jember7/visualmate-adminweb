const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Cloud Function to delete a user from Auth + Firestore
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  // Optional: only superadmins should be able to delete
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to call this function."
    );
  }

  // Get UID from request
  const { uid } = data;

  try {
    // Delete from Auth
    await admin.auth().deleteUser(uid);

    // Delete from Firestore
    await admin.firestore().collection("users").doc(uid).delete();

    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError("unknown", error.message, error);
  }
});
