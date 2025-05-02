document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('prescriptions-list')) {
        loadPrescriptions();
    }
});

async function loadPrescriptions() {
    const container = document.getElementById('prescriptions-list');
    container.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading your prescriptions...</p>
        </div>
    `;

    try {
        const response = await fetch("../database/prescriptions.php");

        if (!response.ok) {
            throw new Error(`Server returned ${response.status} status`);
        }

        const data = await response.json();
        console.log("API Response:", data);

        if (data.status === "success") {
            if (data.prescriptions && data.prescriptions.length > 0) {
                container.innerHTML = createPrescriptionsTable(data.prescriptions);
            } else {
                container.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        No prescriptions found. Upload your first prescription below.
                    </div>
                `;
            }
        } else {
            throw new Error(data.message || 'Failed to load prescriptions');
        }
    } catch (error) {
        console.error("Error loading prescriptions:", error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error loading prescriptions: ${error.message}
                <button onclick="loadPrescriptions()" class="btn btn-sm btn-outline-secondary mt-2">
                    <i class="fas fa-sync-alt me-1"></i> Try Again
                </button>
            </div>
        `;
    }
}

function createPrescriptionsTable(prescriptions) {
    return `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Prescription</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Date Uploaded</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${prescriptions.map(p => `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center">
                                    ${getFileIcon(p.file_type)}
                                    <a href="${p.file_path}" target="_blank" class="ms-2">${p.file_name}</a>
                                </div>
                            </td>
                            <td>${getFileType(p.file_type)}</td>
                            <td>${formatFileSize(p.file_size)}</td>
                            <td>${formatDate(p.upload_date)}</td>
                            <td class="text-end">
                                <div class="btn-group" role="group">
                                    <a href="${p.file_path}" target="_blank" 
                                       class="btn btn-sm btn-outline-primary"
                                       title="View">
                                        <i class="fas fa-eye"></i>
                                    </a>
                                    <button class="btn btn-sm btn-outline-danger delete-btn"
                                            data-id="${p.id}"
                                            title="Delete">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Helper functions
function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return '<i class="fas fa-file-pdf text-danger"></i>';
    if (fileType.includes('image')) return '<i class="fas fa-file-image text-primary"></i>';
    return '<i class="fas fa-file-alt text-secondary"></i>';
}

function getFileType(fileType) {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('jpeg') || fileType.includes('jpg')) return 'JPEG';
    if (fileType.includes('png')) return 'PNG';
    return fileType.split('/')[1] || fileType;
}

function formatFileSize(bytes) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Event delegation for delete buttons
document.addEventListener('click', async function(e) {
    if (e.target.closest('.delete-btn')) {
        const id = e.target.closest('.delete-btn').dataset.id;
        await deletePrescription(id);
    }
});

async function deletePrescription(id) {
    if (!confirm("Are you sure you want to delete this prescription?")) return;
    
    try {
        const response = await fetch("../database/prescriptions.php", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id })
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status} status`);
        }

        const data = await response.json();
        
        if (data.status === "success") {
            showAlert('Prescription deleted successfully', 'success');
            loadPrescriptions();
        } else {
            throw new Error(data.message || 'Failed to delete prescription');
        }
    } catch (error) {
        console.error("Error deleting prescription:", error);
        showAlert(`Error: ${error.message}`, 'danger');
    }
}

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alert.style.zIndex = '1000';
    alert.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
}