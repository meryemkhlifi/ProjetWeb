document.addEventListener('DOMContentLoaded', function() {
    // Initialize calendar
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        editable: true,
        selectable: true,
        events: fetchEvents,
        dateClick: handleDateClick,
        eventClick: handleEventClick,
        eventDrop: handleEventUpdate,
        eventResize: handleEventUpdate
    });
    calendar.render();

    // Modal elements
    const eventModal = new bootstrap.Modal('#eventModal');
    const eventForm = document.getElementById('eventForm');
    const modalTitle = document.getElementById('modalTitle');
    const btnSave = document.getElementById('btnSave');
    const btnCancel = document.getElementById('btnCancel');
    const btnDelete = document.getElementById('btnDelete');
    const colorOptions = document.querySelectorAll('.color-option');

    // Color selection
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('eventColor').value = this.dataset.color;
        });
    });

    // Button events
    btnSave.addEventListener('click', saveEvent);
    btnCancel.addEventListener('click', () => eventModal.hide());
    btnDelete.addEventListener('click', deleteEvent);

    // Fetch events from server
    async function fetchEvents(fetchInfo, successCallback, failureCallback) {
        try {
            const response = await fetch('../database/calendar.php?action=fetch');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            if (data.status === 'success') {
                successCallback(data.events.map(event => ({
                    id: event.id,
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    backgroundColor: event.color,
                    borderColor: event.color,
                    extendedProps: {
                        description: event.description
                    }
                })));
            } else {
                throw new Error(data.message || 'Failed to fetch events');
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            if (failureCallback) failureCallback(error);
            alert('Failed to load events. Please try again.');
        }
    }

    // Handle date click (add new event)
    function handleDateClick(info) {
        resetForm();
        modalTitle.textContent = 'Add New Event';
        document.getElementById('eventStart').value = info.dateStr + 'T10:00';
        document.getElementById('eventEnd').value = info.dateStr + 'T11:00';
        btnDelete.style.display = 'none';
        eventModal.show();
    }

    // Handle event click (edit existing)
    function handleEventClick(info) {
        resetForm();
        modalTitle.textContent = 'Edit Event';
        document.getElementById('eventId').value = info.event.id;
        document.getElementById('eventTitle').value = info.event.title;
        document.getElementById('eventStart').value = formatDateTimeForInput(info.event.start);
        document.getElementById('eventEnd').value = info.event.end ? formatDateTimeForInput(info.event.end) : '';
        document.getElementById('eventColor').value = info.event.backgroundColor || '#4a6bff';
        document.getElementById('eventDescription').value = info.event.extendedProps.description || '';
        btnDelete.style.display = 'block';
        
        // Select the correct color
        colorOptions.forEach(option => {
            option.classList.toggle(
                'selected', 
                option.dataset.color === (info.event.backgroundColor || '#4a6bff')
            );
        });
        
        eventModal.show();
    }

    // Handle event updates (drag/resize)
    async function handleEventUpdate(info) {
        try {
            const response = await fetch('../database/calendar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    id: info.event.id,
                    start: info.event.start.toISOString(),
                    end: info.event.end ? info.event.end.toISOString() : null
                })
            });
            
            const data = await response.json();
            if (data.status !== 'success') {
                throw new Error(data.message || 'Failed to update event');
            }
        } catch (error) {
            console.error('Error updating event:', error);
            calendar.refetchEvents();
            alert('Failed to update event. Changes reverted.');
        }
    }

    // Save event (create or update)
    async function saveEvent() {
        if (!eventForm.checkValidity()) {
            eventForm.classList.add('was-validated');
            return;
        }

        try {
            const formData = {
                action: document.getElementById('eventId').value ? 'update' : 'add',
                title: document.getElementById('eventTitle').value,
                start: document.getElementById('eventStart').value,
                end: document.getElementById('eventEnd').value || null,
                color: document.getElementById('eventColor').value,
                description: document.getElementById('eventDescription').value || null
            };

            // Add ID if updating
            if (document.getElementById('eventId').value) {
                formData.id = document.getElementById('eventId').value;
            }

            const response = await fetch('../database/calendar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            if (data.status === 'success') {
                calendar.refetchEvents();
                eventModal.hide();
            } else {
                throw new Error(data.message || 'Failed to save event');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Error: ' + error.message);
        }
    }

    // Delete event
    async function deleteEvent() {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            const response = await fetch('../database/calendar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    id: document.getElementById('eventId').value
                })
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            if (data.status === 'success') {
                calendar.refetchEvents();
                eventModal.hide();
            } else {
                throw new Error(data.message || 'Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Error: ' + error.message);
        }
    }

    // Helper functions
    function resetForm() {
        eventForm.reset();
        eventForm.classList.remove('was-validated');
        document.getElementById('eventColor').value = '#4a6bff';
        colorOptions[0].classList.add('selected');
        for (let i = 1; i < colorOptions.length; i++) {
            colorOptions[i].classList.remove('selected');
        }
    }

    function formatDateTimeForInput(date) {
        return date.toISOString().slice(0, 16);
    }
});