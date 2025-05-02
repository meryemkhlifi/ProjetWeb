// medications.js

// Add a new medication
async function addMedication(name, dose, time, frequency, instructions) {
    try {
        const response = await fetch("../database/medication.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                dose,
                time,
                frequency,
                instructions
            })
        });

        // First check if response exists
        if (!response) {
            throw new Error('No response from server');
        }

        // Check if response is OK
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === "success") {
            renderMeds();
        } else {
            throw new Error(data.message || 'Unknown error occurred');
        }
    } catch (error) {
        console.error("Error adding medication:", error);
        alert(`Error: ${error.message}`);
    }
}

// Fetch and render medications
async function renderMeds() {
    const container = document.getElementById('medications-list');
    
    try {
        // Show loading state
        container.innerHTML = '<div class="text-center py-3">Loading medications...</div>';
        
        const response = await fetch("../database/medication.php");
        
        // Check if response exists
        if (!response) {
            throw new Error('No response from server');
        }
        
        // Check if response is OK
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        // Get response text first
        const responseText = await response.text();
        
        // Check if response is empty
        if (!responseText) {
            throw new Error('Empty response from server');
        }
        
        // Parse JSON
        const data = JSON.parse(responseText);
        
        if (data.status === "success") {
            if (data.medications && data.medications.length > 0) {
                container.innerHTML = data.medications.map(med => `
                    <div class="card mb-3">
                        <div class="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="card-title mb-1">${med.name}</h5>
                                <p class="card-text mb-0">${med.dose}mg at ${med.time}</p>
                                ${med.frequency ? `<small class="text-muted">Frequency: ${med.frequency}</small>` : ''}
                                ${med.instructions ? `<p class="card-text mt-1"><small>Instructions: ${med.instructions}</small></p>` : ''}
                            </div>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteMed(${med.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div class="alert alert-info">No medications found</div>';
            }
        } else {
            throw new Error(data.message || 'Unknown error occurred');
        }
    } catch (error) {
        console.error("Error fetching medications:", error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load medications: ${error.message}
                <button onclick="renderMeds()" class="btn btn-sm btn-outline-secondary ms-2">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        `;
    }
}

// Delete medication
async function deleteMed(id) {
    if (!confirm("Are you sure you want to delete this medication?")) return;
    
    try {
        const response = await fetch("../database/medication.php", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === "success") {
            renderMeds();
        } else {
            throw new Error(data.message || 'Unknown error occurred');
        }
    } catch (error) {
        console.error("Error deleting medication:", error);
        alert(`Error: ${error.message}`);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', renderMeds);
fetch('http://localhost/mon-projet-alzheimer/database/medication.php', {
    method: 'GET',
    credentials: 'include'  // This is essential for sending cookies
  })