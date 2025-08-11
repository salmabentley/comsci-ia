
document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById('salesChart').getContext('2d');

    // Data passed from Flask via script tag (window.analyticsData)
    const { monthLabels, monthValues, dayLabels, dayValues, yearLabels, yearValues } = window.analyticsData;

    const chartData = {
        'Month': { labels: monthLabels, data: monthValues },
        'Day': { labels: dayLabels, data: dayValues },
        'Year': { labels: yearLabels, data: yearValues }
    };

    let currentView = 'Month';
    document.getElementById('monthButton').focus();

    const salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData[currentView].labels,
            datasets: [{
                label: 'Revenue',
                data: chartData[currentView].data,
                backgroundColor: '#7c4dff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });

    document.querySelectorAll(".toggle-button").forEach(btn => {
        btn.addEventListener("click", function () {
            const view = this.innerText;
            currentView = view;
            salesChart.data.labels = chartData[view].labels;
            salesChart.data.datasets[0].data = chartData[view].data;
            salesChart.update();
        });
    });
});
