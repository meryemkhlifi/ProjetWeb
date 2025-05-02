// profile.js - Complete fixed version

const API_URL = '../database/profile.php';

// Enhanced API request handler
async function handleApiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            credentials: 'include',
            ...options
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `HTTP error ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API request failed:`, error);
        throw error;
    }
}

// Safe element setter with null check
function safeSetElement(id, value, property = 'textContent') {
    const element = document.getElementById(id);
    if (element) {
        element[property] = value !== undefined && value !== null ? value : '';
    } else {
        console.warn(`Element with ID ${id} not found`);
    }
}

async function loadUserData() {
    try {
        const { data } = await handleApiRequest(API_URL);
        return data;
    } catch (error) {
        throw new Error('Failed to load profile data. Please try again later.');
    }
}

async function saveUserData(data) {
    try {
        const result = await handleApiRequest(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return result;
    } catch (error) {
        throw new Error('Failed to save profile: ' + error.message);
    }
}

// Initialize the profile page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const user = await loadUserData();
        populateUserInfo(user);
        setupFormHandlers();
        setupEditButtons(); // Now properly defined
    } catch (error) {
        showError(error.message);
    }
});

function populateUserInfo(user) {
    if (!user) return;
    
    console.log("User data received:", user); // Debug log
    
    // Personal info
    safeSetElement('name', user.personal?.name, 'value');
    safeSetElement('family-name', user.personal?.family_name, 'value');
    safeSetElement('profession', user.personal?.profession, 'value');
    safeSetElement('user-type', user.personal?.user_type);
    safeSetElement('email', user.personal?.email, 'value');
    safeSetElement('dob', user.personal?.dob, 'value');
    
    // Update header
    safeSetElement('user-name', user.personal?.name);
    safeSetElement('user-email', user.personal?.email);
    
    // Medical info
    if (user.medical) {
        safeSetElement('blood-type', user.medical.blood_type, 'value');
        safeSetElement('weight', user.medical.weight, 'value');
        safeSetElement('height', user.medical.height, 'value');
        safeSetElement('primary-doctor', user.medical.primary_doctor, 'value');
        safeSetElement('allergies', user.medical.allergies, 'value');
        safeSetElement('medical-conditions', user.medical.conditions, 'value');
    }
}

function setupFormHandlers() {
    // Personal info form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const data = {
                    personal: {
                        name: document.getElementById('name').value,
                        family_name: document.getElementById('family-name').value,
                        profession: document.getElementById('profession').value,
                        dob: document.getElementById('dob').value
                    }
                };
                
                await saveUserData(data);
                showSuccess('Personal information updated successfully!');
                document.getElementById('user-name').textContent = data.personal.name;
            } catch (error) {
                showError(error.message);
            }
        });
    }
    
    // Medical info form
    const medicalForm = document.getElementById('medical-form');
    if (medicalForm) {
        medicalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const data = {
                    medical: {
                        blood_type: document.getElementById('blood-type').value,
                        weight: parseFloat(document.getElementById('weight').value) || null,
                        height: parseFloat(document.getElementById('height').value) || null,
                        primary_doctor: document.getElementById('primary-doctor').value,
                        allergies: document.getElementById('allergies').value,
                        conditions: document.getElementById('medical-conditions').value
                    }
                };
                
                await saveUserData(data);
                showSuccess('Medical information updated successfully!');
            } catch (error) {
                showError(error.message);
            }
        });
    }
}

// Setup edit buttons functionality
function setupEditButtons() {
    // Personal info edit
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            const inputs = document.querySelectorAll('#profile-form input');
            inputs.forEach(input => input.disabled = false);
            document.getElementById('profile-buttons').style.display = 'block';
            this.style.display = 'none';
        });
    }
    
    // Personal info cancel
    const cancelProfileBtn = document.getElementById('cancel-profile-btn');
    if (cancelProfileBtn) {
        cancelProfileBtn.addEventListener('click', function() {
            location.reload(); // Refresh to reset changes
        });
    }
    
    // Medical info edit
    const editMedicalBtn = document.getElementById('edit-medical-btn');
    if (editMedicalBtn) {
        editMedicalBtn.addEventListener('click', function() {
            const inputs = document.querySelectorAll('#medical-form input, #medical-form select, #medical-form textarea');
            inputs.forEach(input => input.disabled = false);
            document.getElementById('medical-buttons').style.display = 'block';
            this.style.display = 'none';
        });
    }
    
    // Medical info cancel
    const cancelMedicalBtn = document.getElementById('cancel-medical-btn');
    if (cancelMedicalBtn) {
        cancelMedicalBtn.addEventListener('click', function() {
            location.reload(); // Refresh to reset changes
        });
    }
}

// Helper functions
function showSuccess(message) {
    const alert = document.getElementById('success-alert');
    if (alert) {
        document.getElementById('success-message').textContent = message;
        alert.style.display = 'block';
        setTimeout(() => alert.style.display = 'none', 5000);
    }
}

function showError(message) {
    const alert = document.getElementById('error-alert');
    if (alert) {
        document.getElementById('error-message').textContent = message;
        alert.style.display = 'block';
        setTimeout(() => alert.style.display = 'none', 5000);
    }
}