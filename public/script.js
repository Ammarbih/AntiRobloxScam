document.addEventListener('DOMContentLoaded', async () => {
    // Functie om dashboard statistieken op te halen en weer te geven
    async function fetchDashboardStats() {
        try {
            const response = await fetch('/api/admin/dashboard-data');
            console.log('Dashboard data response status:', response.status);
            if (!response.ok) {
                if (response.status === 403) {
                    console.error('Toegang geweigerd: U bent geen beheerder.');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Received dashboard data:', data);

            // Controleer of de data objecten bevat en wijs ze toe
            if (data && typeof data.totalusers === 'number') {
                document.getElementById('totalUsers').textContent = data.totalusers.toLocaleString();
            } else {
                document.getElementById('totalUsers').textContent = 'N/A';
                console.warn('totalUsers data missing or invalid.', data);
            }
            if (data && typeof data.activescammers === 'number') {
                document.getElementById('activeScammers').textContent = data.activescammers.toLocaleString();
            } else {
                document.getElementById('activeScammers').textContent = 'N/A';
                console.warn('activeScammers data missing or invalid.', data);
            }
            if (data && typeof data.newreports === 'number') {
                document.getElementById('newReports').textContent = data.newreports.toLocaleString();
            } else {
                document.getElementById('newReports').textContent = 'N/A';
                console.warn('newReports data missing or invalid.', data);
            }
            if (data && typeof data.resolvedreports === 'number') {
                document.getElementById('resolvedReports').textContent = data.resolvedreports.toLocaleString();
            } else {
                document.getElementById('resolvedReports').textContent = 'N/A';
                console.warn('resolvedReports data missing or invalid.', data);
            }

        } catch (error) {
            console.error('Fout bij ophalen dashboard statistieken:', error);
            document.getElementById('totalUsers').textContent = 'Fout';
            document.getElementById('activeScammers').textContent = 'Fout';
            document.getElementById('newReports').textContent = 'Fout';
            document.getElementById('resolvedReports').textContent = 'Fout';
        }
    }

    // Functie om recente activiteit op te halen en weer te geven
    async function fetchRecentActivity() {
        try {
            const response = await fetch('/api/admin/recent-activity');
            if (!response.ok) {
                if (response.status === 403) {
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const activities = await response.json();

            const activityListElement = document.querySelector('.activity-list ul');
            activityListElement.innerHTML = ''; // Maak de lijst leeg

            activities.forEach(activity => {
                const listItem = document.createElement('li');
                listItem.className = 'activity-item';
                listItem.innerHTML = `
                    <span>${activity.activity}</span>
                    <span class="timestamp">${new Date(activity.timestamp).toLocaleDateString()} ${new Date(activity.timestamp).toLocaleTimeString()}</span>
                `;
                activityListElement.appendChild(listItem);
            });

        } catch (error) {
            console.error('Fout bij ophalen recente activiteit:', error);
        }
    }

    // Roep functies aan bij het laden van de pagina
    fetchDashboardStats();
    fetchRecentActivity();

    // Optioneel: ververs de data periodiek
    // setInterval(fetchDashboardStats, 60000); // Elke minuut
    // setInterval(fetchRecentActivity, 30000); // Elke 30 seconden
}); 