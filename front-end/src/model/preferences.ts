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
    collapseDescriptionsByDefault: true
};

const userPrefsKey = "userPreferences";
export const enablePreferences = false;

/**
 * Gets the user preferences for this device.
 */
export function getPreferences(): UserPreferences {
    if (!enablePreferences) {
        return defaultPreferences;
    }

    let val = window.localStorage.getItem(userPrefsKey);
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
    window.localStorage.setItem(userPrefsKey, JSON.stringify(preferences));
}
