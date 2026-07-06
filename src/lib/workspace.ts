export const syncTaskToCalendar = async (taskTitle: string, dueDate: string, accessToken: string) => {
  const startDate = new Date(dueDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const event = {
    summary: taskTitle,
    description: 'Tarefa criada no Agenda Pro',
    start: {
      dateTime: startDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
  if (!response.ok) {
    console.error('Calendar error:', await response.text());
    throw new Error('Failed to sync task to calendar');
  }
  return await response.json();
};

export const exportReportToDrive = async (reportContent: string, accessToken: string) => {
  const metadata = {
    name: `Agenda_Pro_Report_${new Date().toISOString().split('T')[0]}.txt`,
    mimeType: 'text/plain'
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([reportContent], { type: 'text/plain' }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error('Failed to export to drive');
  }

  return await response.json();
};

export const syncProjectToCalendar = async (projectName: string, dueDate: string, accessToken: string) => {
  const startDate = new Date(dueDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const event = {
    summary: `Projeto: ${projectName}`,
    description: 'Projeto criado no Agenda Pro',
    start: {
      dateTime: startDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
  if (!response.ok) {
    console.error('Calendar error:', await response.text());
    throw new Error('Failed to sync project to calendar');
  }
  return await response.json();
};


export const deleteEventFromCalendar = async (eventId: string, accessToken: string) => {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    console.error('Calendar delete error:', await response.text());
    throw new Error('Failed to delete event from calendar');
  }
};
