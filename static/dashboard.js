window.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('salesChart');
    console.log(ctx)
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: sales_label,
            datasets: [{
              data: sales_values,
              backgroundColor: '#7a5af5'
            }]
          },
          options: {
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return '$' + context.raw;
                  }
                }
              }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
})