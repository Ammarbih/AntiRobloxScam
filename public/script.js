document.addEventListener('DOMContentLoaded', async () => {
    // Functie om dashboard statistieken op te halen en weer te geven
    async function fetchDashboardStats() {
        try {
            const response = await fetch('/api/admin/dashboard-data');
            if (!response.ok) {
                if (response.status === 403) {
                    console.error('Toegang geweigerd: U bent geen beheerder.');
                    // Optioneel: toon een melding aan de gebruiker
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            document.getElementById('totalUsers').textContent = data.totalUsers.toLocaleString();
            document.getElementById('activeScammers').textContent = data.activeScammers.toLocaleString();
            document.getElementById('newReports').textContent = data.newReports.toLocaleString();
            document.getElementById('resolvedReports').textContent = data.resolvedReports.toLocaleString();

        } catch (error) {
            console.error('Fout bij ophalen dashboard statistieken:', error);
        }
    }

    // Functie om recente activiteit op te halen en weer te geven
    async function fetchRecentActivity() {
        try {
            const response = await fetch('/api/admin/recent-activity');
            if (!response.ok) {
                if (response.status === 403) {
                    // Al afgehandeld in fetchDashboardStats, maar hier ook voor de zekerheid
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