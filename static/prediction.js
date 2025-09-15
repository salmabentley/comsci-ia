let chart;

window.onload = () => {
  const ctx = document.getElementById('salesChart').getContext('2d');
  chart = new Chart(ctx, createConfig(weekData)); // default = week
};
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
        fill: dataset.type === "line",
        tension: dataset.type === "line" ? 0.2 : 0
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  };
}

function switchView(view) {
  let newData;
  if (view === 'week') newData = weekData;
  if (view === 'month') newData = monthData;
  if (view === 'year') newData = yearData;

  chart.destroy(); // remove old chart
  chart = new Chart(document.getElementById('salesChart'), createConfig(newData));
}
