// Authentication functions
let currentUser = null;

function exitToVolumes() {
    window.location.href = '../../index.html';
}

function updateAuthUI() {
    const displayName = document.getElementById('user-display-name');
    if (currentUser && displayName) {
        const username = currentUser.user_metadata?.username || currentUser.email?.split('@')[0];
        displayName.textContent = username;
    }
}

function getUserDisplayName() {
    if (!currentUser) return 'Guest';
    return currentUser.user_metadata?.username || currentUser.email?.split('@')[0];
}

function goToMenu() {
    if (currentUser) {
        showScreen('title-screen');
    } else {
        window.location.href = '../../index.html';
    }
}

// Initialize auth - call this on page load
async function initAuth() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error('Auth error:', error);
            window.location.href = '../../index.html';
            return false;
        }

        currentUser = session?.user || null;

        if (!currentUser) {
            window.location.href = '../../index.html';
            return false;
        }

        console.log('User authenticated');
        updateAuthUI();
        return true;
    } catch (err) {
        console.error('Auth exception:', err);
        window.location.href = '../../index.html';
        return false;
    }
}

// Listen for sign out events only
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
        if (typeof Analytics !== 'undefined') {
            Analytics.trackAuth('logout');
            await Analytics.flush();
            Analytics.setUser(null);
        }
        currentUser = null;
        window.location.href = '../../index.html';
    } else if (session?.user) {
        currentUser = session.user;
        if (typeof Analytics !== 'undefined') {
            Analytics.setUser(currentUser);
        }
        updateAuthUI();
    }
});
