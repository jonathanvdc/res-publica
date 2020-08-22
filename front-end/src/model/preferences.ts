/**
 * Captures user preferences.
 */
export type UserPreferences = {
    /**
     * Tells if vote descriptions should be collapsed by default.
     */
    collapseDescriptionsByDefault: boolean;
};

/**
 * The default user preferences.
 */
const defaultPreferences: UserPreferences = {
    collapseDescriptionsByDefault: false
};

const userPrefsKey = "userPreferences";

/**
 * Gets the user preferences for this device.
 */
export function getPreferences(): UserPreferences {
    let val = localStorage.getItem(userPrefsKey);
    if (val) {
        return { ...defaultPreferences, ...JSON.parse(val) };
    } else {
        setPreferences(defaultPreferences);
        return defaultPreferences;
    }
}

/**
 * Sets the user's preferences for this device.
 * @param preferences The user's preferences for this device.
 */
export function setPreferences(preferences: UserPreferences): void {
    localStorage.setItem(userPrefsKey, JSON.stringify(preferences));
}
