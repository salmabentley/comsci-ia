let chart;

// getting the chart ready as soon as the window loads
window.onload = () => {
  const ctx = document.getElementById('salesChart').getContext('2d');
  // initialising the chart with weekly data by default
  chart = new Chart(ctx, createConfig(weekData)); 
};

// a helper function to build our chart configuration and keep things organised
function createConfig(dataset) {
  return {
    type: dataset.type,
    data: {
      labels: dataset.labels,
      datasets: [{
        label: "Predicted Sales",
        data: dataset.values,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.3)',
        // fills the area under the line if we're using a line graph
        fill: dataset.type === "line",
        // smoothing out the lines for a cleaner aesthetic
        tension: dataset.type === "line" ? 0.2 : 0
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { 
          // making sure the scale starts at zero for fair data representation
          beginAtZero: true 
        }
      }
    }
  };
}

// switches the view between week, month, and year to help with trend visualisation
function switchView(view) {
  let newData;
  if (view === 'week') newData = weekData;
  if (view === 'month') newData = monthData;
  if (view === 'year') newData = yearData;

  // we have to destroy the old chart instance before creating a new one to avoid glitches
  chart.destroy(); 
  chart = new Chart(document.getElementById('salesChart'), createConfig(newData));
}