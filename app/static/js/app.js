/**
 * Client-side script for Habitty:
 * Initializes the Chart.js weekly completion chart and progressive AJAX habit toggles.
 */
document.addEventListener("DOMContentLoaded", () => {
    const chartCanvas = document.getElementById("weeklyCompletionChart");
    if (chartCanvas && window.HABITTY_WEEKLY_DATA && typeof Chart !== "undefined") {
        const ctx = chartCanvas.getContext("2d");
        const { labels, counts } = window.HABITTY_WEEKLY_DATA;

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Completed Habits",
                        data: counts,
                        backgroundColor: "#4f46e5",
                        borderRadius: 6,
                        maxBarThickness: 42,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, precision: 0 },
                    },
                },
            },
        });
    }
});
