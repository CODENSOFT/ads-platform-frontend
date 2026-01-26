/**
 * Get ad ID from ad object
 * @param {Object|null|undefined} ad - Ad object
 * @returns {string|null} - Ad ID or null if not found
 */
export const getAdId = (ad) => {
  if (!ad) return null;
  const adId = ad._id || ad.id;
  if (!adId) return null;
  const adIdStr = String(adId).trim();
  return adIdStr === '' || adIdStr === 'null' || adIdStr === 'undefined' ? null : adIdStr;
};

/**
 * Get receiver ID (seller/owner) from ad object
 * Checks multiple possible fields in order of priority
 * @param {Object|null|undefined} ad - Ad object
 * @returns {string|null} - Receiver ID or null if not found
 */
export const getReceiverIdFromAd = (ad) => {
  if (!ad) return null;

  // Check fields in order of priority
  const receiverId = 
    ad.user?._id ||
    ad.userId ||
    ad.owner?._id ||
    ad.ownerId ||
    ad.createdBy?._id ||
    ad.createdById ||
    ad.seller?._id ||
    ad.sellerId;

  if (!receiverId) return null;
  
  const receiverIdStr = String(receiverId).trim();
  return receiverIdStr === '' || receiverIdStr === 'null' || receiverIdStr === 'undefined' ? null : receiverIdStr;
};
