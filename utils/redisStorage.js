import Redis from "ioredis";

// Initialize Redis client
const redis = new Redis();

// Store rider location (latitude, longitude) using GEOADD
async function storeRiderLocation(riderId, lat, lon) {
  await redis.geoadd("activeRiders", lon, lat, riderId);
  // console.log(`Rider ${riderId} location stored.`);
}

// Set rider status using a Redis Hash
async function setRiderStatus(riderId, status) {
  await redis.hset("riderStatus", riderId, status); //"1":available, "0":"false"
  console.log(`Rider ${riderId} status set to ${status}.`);
}

// Find available riders within a given radius
async function findAvailableRiders(lat, lon, radius = 1000) {
  const riders = await redis.georadius(
    "activeRiders",
    lon,
    lat,
    radius,
    "m",
    "WITHDIST"
  );

  // Filter riders based on their availability status and construct full entries
  const availableRiders = [];
  for (const [riderId, distance] of riders) {
    // Fetch the rider's status
    const status = await redis.hget("riderStatus", riderId);

    // If the rider is available, construct the full entry
    if (status.toString() === "1") {
      const location = await redis.geopos("activeRiders", riderId); // Get rider's location (lat, lon)
      availableRiders.push({
        riderId,
        latitude: location[0][0], // latitude of rider
        longitude: location[0][1], // longitude of rider
        distance, // distance from the query location
        status,
      });
    }
  }
  //sort riders in decending order
  availableRiders.sort((a, b) => a.distance - b.distance);
  return availableRiders;
}

// Store active member (user) data in Redis
async function storeActiveMember(userId, socketId, email, role) {
  // Store individual fields in the hash for each active member
  await redis.hset(`activeMembers:${role}`, userId, socketId);
  await redis.hset(`activeMembers:${role}:email`, userId, email);
  await reverseSocket(socketId, `${userId}:::${role}`);
  console.log(
    `Active member ${userId} stored with socketId: ${socketId} and email: ${email}`
  );
}

// Reverse mapping for socketId to userId
async function reverseSocket(userId, socketId) {
  // Store the reverse mapping of socketId to userId in a hash
  await redis.hset("reverseSockets", socketId, userId);
  console.log(`SocketId ${socketId} mapped to userId ${userId}`);
}

async function getUserIdfromSocket(userId, socketId) {
  // Store the reverse mapping of socketId to userId in a hash
  return await redis.get("reverseSockets", socketId);
}
// Retrieve active member data by userId and role
async function getActiveMember(userId, role) {
  const socketId = await redis.hget(`activeMembers:${role}`, userId);
  const email = await redis.hget(`activeMembers:${role}:email`, userId);

  if (socketId && email) {
    console.log(`User: ${userId}, SocketId: ${socketId}, Email: ${email}`);
    return { socketId, email, userId };
  } else {
    console.log(`User ${userId} not found.`);
    return null;
  }
}

// Retrieve all active members by role
async function getAllActiveMembers(role) {
  const socketIds = await redis.hgetall(`activeMembers:${role}`);
  const emailAddresses = await redis.hgetall(`activeMembers:${role}:email`);

  const result = [];
  for (const [userId, socketId] of Object.entries(socketIds)) {
    const email = emailAddresses[userId];
    result.push({ userId, socketId, email });
  }

  console.log("All Active Members:", result);
  return result;
}

// Delete active member data from Redis
async function deleteActiveMember(userId, role) {
  try {
    // Remove the socketId from the activeMembers:{role} hash
    await redis.hdel(`activeMembers:${role}`, userId);
    console.log(`Removed userId ${userId} from activeMembers:${role}`);

    // Remove the email from the activeMembers:{role}:email hash
    await redis.hdel(`activeMembers:${role}:email`, userId);
    console.log(`Removed userId ${userId} from activeMembers:${role}:email`);

    // Remove the reverse mapping of socketId to userId from the reverseSockets hash
    const socketId = await redis.hget(`activeMembers:${role}`, userId);
    if (socketId) {
      await redis.hdel("reverseSockets", socketId);
      console.log(`Removed socketId ${socketId} from reverseSockets`);
    }
    console.log(`Active member ${userId} successfully deleted.`);
    return true;
  } catch (err) {
    return false;
  }
}

export {
  deleteActiveMember,
  findAvailableRiders,
  setRiderStatus,
  storeRiderLocation,
  getActiveMember,
  storeActiveMember,
  reverseSocket,
  getAllActiveMembers,
  getUserIdfromSocket,
  redis,
};
