import { assert } from "chai";
import { 
  storeRiderLocation, 
  setRiderStatus, 
  findAvailableRiders,
  storeActiveMember,
  deleteActiveMember,
  getActiveMember,
  getAllActiveMembers,
  redis
} from "../utils/redisStorage.js";  // Import functions to test

describe("Testing redis storage", () => {
    before(async () => {
        // Setup: Optionally clean the Redis database
        await redis.flushdb();  // Clear Redis DB before each test to isolate tests
    });

    after(async () => {
        // Cleanup: Optionally clear the Redis database after each test
        await redis.flushdb();
    });

    it("should connect to redis server", async () => {
        let result = await redis.ping();
        assert.equal(result, "PONG");
    });

    it("should store rider location", async () => {
        const riderId = "rider1";
        const lat = 40.71279898695150479;
        const lon = -74.0060010552406311;

        // Call the storeRiderLocation function
        await storeRiderLocation(riderId, lat, lon);

        // Verify if the rider location is stored in the "activeRiders" Geo set
        const location = await redis.geopos('activeRiders', riderId);
        assert.deepEqual([Math.trunc(location[0][0]), Math.trunc(location[0][1])] , [Math.trunc(lon), Math.trunc(lat)], "Rider location should match the stored latitude and longitude.");
    });

    it("should set rider status", async () => {
        const riderId = "rider1";
        const status = "available"; // Possible statuses: "1" (available), "0" (not available)

        // Call the setRiderStatus function
        await setRiderStatus(riderId, status);

        // Verify the rider's status is correctly set in the "riderStatus" hash
        const storedStatus = await redis.hget('riderStatus', riderId);
        assert.equal(storedStatus, status, "Rider status should match the stored status.");
    });

    it("should find available riders within a radius", async () => {
        const riderId1 = "rider1";
        const riderId2 = "rider2";
        const lat = 40.7128;
        const lon = -74.0060;
        const radius = 5000; // 5 km radius

        // Store locations for multiple riders
        await storeRiderLocation(riderId1, lat, lon);
        await storeRiderLocation(riderId2, 40.7306, -73.9352); // Somewhat close but not within radius

        // Set availability for riders
        await setRiderStatus(riderId1, "available");
        await setRiderStatus(riderId2, "0"); // Not available

        // Call the findAvailableRiders function
        const availableRiders = await findAvailableRiders(lat, lon, radius);

        // Verify that only rider1 is returned and within the radius
        assert.equal(availableRiders.length, 1, "Only one rider should be available.");
        assert.equal(availableRiders[0].riderId, riderId1, "Rider1 should be the available rider.");
    });

    it("should store active member", async () => {
        const userId = "user123";
        const socketId = "socket456";
        const email = "user@example.com";
        const role = "admin";

        // Call the storeActiveMember function
        await storeActiveMember(userId, socketId, email, role);

        // Verify if the data is correctly stored in Redis
        const socketInRedis = await redis.hget(`activeMembers:${role}`, userId);
        const emailInRedis = await redis.hget(`activeMembers:${role}:email`, userId);

        assert.equal(socketInRedis, socketId, "Socket ID should match the stored value.");
        assert.equal(emailInRedis, email, "Email should match the stored value.");
    });

    it("should delete active member", async () => {
        const userId = "user123";
        const role = "admin";

        // Call the deleteActiveMember function
        const deletionResult = await deleteActiveMember(userId, role);

        // Verify if the user is deleted from the Redis data
        const socketInRedis = await redis.hget(`activeMembers:${role}`, userId);
        const emailInRedis = await redis.hget(`activeMembers:${role}:email`, userId);

        assert.isNull(socketInRedis, "User's socket ID should be deleted.");
        assert.isNull(emailInRedis, "User's email should be deleted.");
        assert.isTrue(deletionResult, "Active member deletion should return true.");
    });

    it("should retrieve active member", async () => {
        const userId = "user123";
        const socketId = "socket456";
        const email = "user@example.com";
        const role = "admin";

        // Store active member before retrieving
        await storeActiveMember(userId, socketId, email, role);

        // Retrieve active member
        const activeMember = await getActiveMember(userId, role);

        assert.isNotNull(activeMember, "Active member should be found.");
        assert.equal(activeMember.userId, userId, "User ID should match.");
        assert.equal(activeMember.socketId, socketId, "Socket ID should match.");
        assert.equal(activeMember.email, email, "Email should match.");
    });

    it("should retrieve all active members by role", async () => {
        const userId1 = "user123";
        const socketId1 = "socket456";
        const email1 = "user1@example.com";
        const role = "admin";

        const userId2 = "user124";
        const socketId2 = "socket457";
        const email2 = "user2@example.com";

        // Store active members
        await storeActiveMember(userId1, socketId1, email1, role);
        await storeActiveMember(userId2, socketId2, email2, role);

        // Retrieve all active members
        const activeMembers = await getAllActiveMembers(role);

        assert.equal(activeMembers.length, 2, "There should be two active members.");
        assert.equal(activeMembers[0].userId, userId1, "First user should be user123.");
        assert.equal(activeMembers[1].userId, userId2, "Second user should be user124.");
    });
});
