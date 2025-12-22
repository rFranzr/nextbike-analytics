/**
 * Application configuration
 */

/**
 * Adjustment factor for Haversine distance calculations.
 * Bike rides typically don't follow the direct path, so this factor
 * accounts for the actual route taken (detours, turns, etc.).
 * 
 * Default: 1.2 (20% increase over straight-line distance)
 */
export const HAVERSINE_DISTANCE_ADJUSTMENT_FACTOR = 1.2;
export const NEXTBIKE_API_KEY = "rXXqTgQZUPZ89lzB";

