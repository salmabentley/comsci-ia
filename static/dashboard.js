window.addEventListener('DOMContentLoaded', () => {
    // waiting for the document to be fully ready before initialising the chart
    const ctx = document.getElementById('salesChart');

    new Chart(ctx, {
        type: 'bar',
        data: {
            // pulling in our labels and values for the data visualisation
            labels: sales_label,
            datasets: [{
                data: sales_values,
                // setting the bar colour to a nice vibrant purple
                backgroundColor: '#7a5af5'
            }]
        },
        options: {
            plugins: {
                // hiding the legend since we only have one dataset and it keeps things clean
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        // adding a dollar sign to the tooltip so the data reads as currency
                        label: function(context) {
                            return '$' + context.raw;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    // making sure the chart starts at zero so the bars aren't misleading
                    beginAtZero: true 
                }
            }
        }
    });
})