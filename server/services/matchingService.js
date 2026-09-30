import store from '../data/store.js';

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 999;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.max(0.5, Number(d.toFixed(1)));
}

/**
 * Calculates Smart Donor Match score based on:
 * - Blood group compatibility (+25 pts for exact, +12 for universal)
 * - Proximity / Distance (up to 20 pts)
 * - Availability & Eligibility (up to 15 pts)
 * - Urgency multiplier (+4 pts for Critical)
 * Base score: 50. Output clamped between 45 and 99.
 */
export function calculateDonorMatch(donor, reqGroup, reqUrgency, reqLat, reqLng) {
  const compatibility = store.data.compatibility;
  const compatibleList = compatibility[reqGroup] || [];
  const isCompat = compatibleList.includes(donor.bloodGroup);

  if (!isCompat) {
    return {
      score: 0,
      eligible: false,
      isCompatible: false,
      distance: 999,
      reasons: ['Blood group incompatible']
    };
  }

  const distanceKm = calculateDistanceKm(donor.latitude, donor.longitude, reqLat, reqLng);
  const reasons = [];

  let score = 50;

  // Exact blood group bonus
  if (donor.bloodGroup === reqGroup) {
    score += 25;
    reasons.push(`Exact blood match (${donor.bloodGroup})`);
  } else {
    score += 12;
    reasons.push(`Universal compatible match (${donor.bloodGroup} for ${reqGroup})`);
  }

  // Distance scoring
  if (distanceKm < 3) {
    score += 20;
    reasons.push(`Ultra-close proximity (${distanceKm} km)`);
  } else if (distanceKm < 6) {
    score += 14;
    reasons.push(`Close proximity (${distanceKm} km)`);
  } else if (distanceKm < 10) {
    score += 8;
    reasons.push(`Medium range (${distanceKm} km)`);
  } else {
    score += 3;
    reasons.push(`Extended range (${distanceKm} km)`);
  }

  // Availability & eligibility
  const isEligible = donor.eligibilityStatus === 'Eligible';
  if (donor.available && isEligible) {
    score += 15;
    reasons.push('Donor active & clinically eligible to donate');
  } else if (donor.available) {
    score += 5;
    reasons.push('Donor online (pending screening)');
  } else {
    score -= 10;
    reasons.push('Donor currently offline/busy');
  }

  // Urgency boost
  if (reqUrgency === 'Critical') {
    score = Math.min(99, score + 4);
    reasons.push('Critical priority emergency boost');
  }

  const finalScore = Math.min(99, Math.max(45, score));

  return {
    score: finalScore,
    eligible: isEligible,
    isCompatible: true,
    distance: distanceKm,
    reasons
  };
}

/**
 * Finds and ranks matching donors for a given emergency request.
 */
export function findMatchingDonors({ bloodGroup, urgency, latitude, longitude, limit = 8 }) {
  const allDonors = store.getDonors();
  const matched = [];

  for (const donor of allDonors) {
    const match = calculateDonorMatch(donor, bloodGroup, urgency, latitude, longitude);
    if (match.isCompatible && match.score > 0) {
      matched.push({
        donorId: donor.id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        phone: donor.phone,
        distance: match.distance,
        availability: donor.available ? 'Available Now' : 'Busy',
        eligibility: donor.eligibilityStatus,
        matchScore: match.score,
        reasons: match.reasons,
        status: 'Identified',
        lastDonationDate: donor.lastDonationDate,
        latitude: donor.latitude,
        longitude: donor.longitude
      });
    }
  }

  matched.sort((a, b) => b.matchScore - a.matchScore);
  return matched.slice(0, limit);
}

/**
 * Finds nearby blood banks with available or compatible inventory.
 */
export function findNearbyBloodBanks({ bloodGroup, latitude, longitude, minUnits = 1 }) {
  const bloodBanks = store.getBloodBanks();
  const results = [];

  for (const bank of bloodBanks) {
    const distanceKm = calculateDistanceKm(bank.lat, bank.lng, latitude, longitude);
    const availableUnits = bank.inventory[bloodGroup] || 0;
    const reservedUnits = bank.reserved[bloodGroup] || 0;

    results.push({
      id: bank.id,
      name: bank.name,
      area: bank.area,
      lat: bank.lat,
      lng: bank.lng,
      contact: bank.contact,
      distanceKm,
      availableUnits,
      reservedUnits,
      hasStock: availableUnits >= minUnits,
      totalGroupInventory: bank.inventory
    });
  }

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  return results;
}
