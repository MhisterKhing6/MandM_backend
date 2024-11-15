const assignOrderToRider = async (orderId, pickupLocation) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    // Step 1: Find eligible riders
    const eligibleRiders = await Rider.find({
      isAvailable: true,
      location: { $near: pickupLocation, $maxDistance: MAX_DISTANCE * 1000 }, // within radius in meters
      assignedOrders: { $size: { $lt: MAX_ORDERS_PER_RIDER } },
    });

    if (!eligibleRiders.length) {
      console.log("No available riders found within range");
      return null;
    }

    // Step 2: Calculate rider ranking based on distance and load
    const rankedRiders = eligibleRiders
      .map((rider) => {
        const distanceToPickup = calculateDistance(
          rider.location,
          pickupLocation
        );
        return {
          ...rider._doc, // spread the rider details
          distanceToPickup,
          load: rider.assignedOrders.length, // fewer orders -> higher priority
        };
      })
      .sort(
        (a, b) => a.load - b.load || a.distanceToPickup - b.distanceToPickup
      );

    // Step 3: Select the best-ranked rider
    const selectedRider = rankedRiders[0];

    // Step 4: Assign the order to the selected rider
    selectedRider.assignedOrders.push(orderId);
    await Rider.findByIdAndUpdate(selectedRider._id, {
      assignedOrders: selectedRider.assignedOrders,
    });

    // Update order with assigned rider and set status
    order.assignedRider = selectedRider._id;
    order.status = "Assigned";
    await order.save();

    // Notify the rider of the new order assignment (via push notification, etc.)
    console.log(`Order ${orderId} assigned to Rider ${selectedRider._id}`);
    return selectedRider._id;
  } catch (error) {
    console.error("Error assigning order:", error);
  }
};

// Utility function to calculate distance between two points (Haversine formula)
const calculateDistance = (loc1, loc2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(loc2.latitude - loc1.latitude);
  const dLon = toRadians(loc2.longitude - loc1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(loc1.latitude)) *
      Math.cos(toRadians(loc2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (deg) => deg * (Math.PI / 180);

const reassignOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    // Mark the original rider as available and remove the order
    const originalRider = await Rider.findById(order.assignedRider);
    if (originalRider) {
      originalRider.assignedOrders = originalRider.assignedOrders.filter(
        (id) => id.toString() !== orderId.toString()
      );
      await originalRider.save();
    }

    // Attempt to assign the order to another rider
    const newRiderId = await assignOrderToRider(orderId, order.pickupLocation);
    if (newRiderId) {
      console.log(`Order ${orderId} reassigned to Rider ${newRiderId}`);
    } else {
      console.log(`No riders available for reassigning Order ${orderId}`);
      order.status = "Unassigned";
      await order.save();
    }
  } catch (error) {
    console.error("Error reassigning order:", error);
  }
};
