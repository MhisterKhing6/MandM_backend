import geolib from 'geolib';

// Function to calculate fare
function calculateFare(startPoint, endPoint) {
    const baseFare = 15;
    const perKilometerCharge = 3;
    // Calculate the distance between the points in meters
    const distanceInMeters = geolib.getDistance(startPoint, endPoint);

    // Convert the distance to kilometers (1 km = 1000 meters)
    const distanceInKilometers = distanceInMeters / 1000;

    // Calculate the fare based on the distance
    const fareForDistance = distanceInKilometers * perKilometerCharge;

    // Calculate the total fare by adding the base fare
    const totalFare = baseFare + fareForDistance;

    // Return the total fare and the distance
    return {
        distanceInKilometers: distanceInKilometers.toFixed(2), // Round to 2 decimal places
        totalFare: totalFare.toFixed(2) // Round to 2 decimal places
    };
}

export {calculateFare}