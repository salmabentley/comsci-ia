document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById('salesChart').getContext('2d');

    // pulling the data passed from flask via the script tag (window.analyticsdata)
    const { monthLabels, monthValues, dayLabels, dayValues, yearLabels, yearValues } = window.analyticsData;

    // organising the data into a structure we can easily swap out
    const chartData = {
        'Month': { labels: monthLabels, data: monthValues },
        'Day': { labels: dayLabels, data: dayValues },
        'Year': { labels: yearLabels, data: yearValues }
    };

    let currentView = 'Month';
    // setting the default focus to the monthly view
    document.getElementById('monthButton').focus();

    // initialising the chart with the monthly data
    const salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData[currentView].labels,
            datasets: [{
                label: 'Revenue',
                data: chartData[currentView].data,
                // using a purple colour for the bars
                backgroundColor: '#7c4dff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                // hiding the legend for a cleaner look
                legend: { display: false }
            }
        }
    });

    // setting up listeners for the toggle buttons to update the visualisation
    document.querySelectorAll(".toggle-button").forEach(btn => {
        btn.addEventListener("click", function () {
            const view = this.innerText;
            currentView = view;
            
            // updating the chart data and labels, then forcing a re-render
            salesChart.data.labels = chartData[view].labels;
            salesChart.data.datasets[0].data = chartData[view].data;
            salesChart.update();
        });
    });
});