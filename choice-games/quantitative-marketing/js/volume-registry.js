/**
 * Shared volume registry loader.
 * Loads volumes/registry.json from the correct relative path
 * regardless of whether the caller is at root or in a subdirectory.
 */
async function loadVolumeRegistry() {
    'use strict';
    let basePath = '';
    if (window.location.pathname.includes('/volumes/')) {
        basePath = '../../';
    }
    const response = await fetch(basePath + 'volumes/registry.json');
    if (!response.ok) {
        throw new Error('Failed to load volume registry');
    }
    return response.json();
}
