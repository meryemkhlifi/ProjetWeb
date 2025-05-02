let isSubmitting = false;

async function renderContacts() {
    const spinner = document.getElementById('loading-spinner');
    const contactsList = document.getElementById('contacts-list');
    
    try {
        spinner.style.display = 'block';
        contactsList.innerHTML = '';
        
        const response = await fetch('../database/emergency.php?action=get');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to load contacts');
        }

        if (result.data.length === 0) {
            contactsList.innerHTML = '<div class="alert alert-info">No emergency contacts found</div>';
            return;
        }

        let html = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Relation</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>`;
        
        result.data.forEach(contact => {
            html += `
                <tr data-id="${contact.id}">
                    <td>${escapeHtml(contact.name)}</td>
                    <td><a href="tel:${contact.phone}">${escapeHtml(contact.phone)}</a></td>
                    <td>${escapeHtml(contact.relation)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${contact.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>`;
        });
        
        html += '</tbody></table>';
        contactsList.innerHTML = html;

        // Add delete handlers
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteContact);
        });

    } catch (error) {
        showAlert('error', error.message);
    } finally {
        spinner.style.display = 'none';
    }
}

async function deleteContact(event) {
    if (isSubmitting) return;
    isSubmitting = true;
    
    const button = event.currentTarget;
    const contactId = button.dataset.id;
    const originalText = button.innerHTML;
    
    try {
        button.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        
        const response = await fetch('../database/emergency.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: contactId })
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to delete contact');
        }

        showAlert('success', 'Contact deleted successfully');
        await renderContacts();
    } catch (error) {
        showAlert('error', error.message);
    } finally {
        button.innerHTML = originalText;
        isSubmitting = false;
    }
}

// Form submission handler
document.getElementById('add-contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    
    const form = e.target;
    const button = document.getElementById('add-contact-button');
    const originalText = button.innerHTML;
    
    try {
        button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Adding...';
        
        const formData = {
            name: form.name.value.trim(),
            phone: form.phone.value.trim(),
            relation: form.relation.value.trim()
        };

        // Client-side validation
        if (!formData.name || !formData.phone || !formData.relation) {
            throw new Error('All fields are required');
        }

        const response = await fetch('../database/emergency.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to add contact');
        }

        showAlert('success', 'Contact added successfully');
        form.reset();
        await renderContacts();
    } catch (error) {
        showAlert('error', error.message);
    } finally {
        button.innerHTML = originalText;
        isSubmitting = false;
    }
});

function showAlert(type, message) {
    const alertEl = document.getElementById(`${type}-alert`);
    const messageEl = document.getElementById(`${type}-message`);
    
    alertEl.style.display = 'block';
    messageEl.textContent = message;
    
    setTimeout(() => {
        alertEl.style.display = 'none';
    }, 5000);
}

function escapeHtml(unsafe) {
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize
document.addEventListener('DOMContentLoaded', renderContacts);