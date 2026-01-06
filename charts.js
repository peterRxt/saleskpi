function renderBranchChart(filteredData) {
  const branchData = getBranchComparison(filteredData);
  const sortBy = document.getElementById('branchSort')?.value || 'sales';
  
  destroyChart('branchChart');
  
  if (!branchData || Object.keys(branchData).length === 0) {
    createEmptyState('branchChart', 'No branch data available');
    
    // Update branch metrics to show "--"
    document.getElementById('top-branch').textContent = '--';
    document.getElementById('highest-average').textContent = '--';
    document.getElementById('most-customers').textContent = '--';
    return;
  }
  
  console.log(`🏬 Rendering branch chart with ${Object.keys(branchData).length} branches`);
  
  // Sort branches based on selected metric
  let sortedBranches = Object.entries(branchData);
  if (sortBy === 'sales') {
    sortedBranches.sort((a, b) => b[1].totalSales - a[1].totalSales);
  } else if (sortBy === 'customers') {
    sortedBranches.sort((a, b) => b[1].totalCustomers - a[1].totalCustomers);
  } else {
    sortedBranches.sort((a, b) => b[1].averageSalePerCustomer - a[1].averageSalePerCustomer);
  }
  
  const branches = sortedBranches.map(([branch]) => branch);
  const sales = sortedBranches.map(([, data]) => data.totalSales);
  const customers = sortedBranches.map(([, data]) => data.totalCustomers);
  const averages = sortedBranches.map(([, data]) => data.averageSalePerCustomer);
  
  const ctx = document.getElementById('branchChart').getContext('2d');
  
  // Create gradient for bars
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.8)');
  gradient.addColorStop(1, 'rgba(79, 70, 229, 0.2)');
  
  // Determine data to show based on sort
  let chartData, chartLabel, yAxisTitle;
  if (sortBy === 'sales') {
    chartData = sales;
    chartLabel = 'Total Sales';
    yAxisTitle = 'Sales Amount';
  } else if (sortBy === 'customers') {
    chartData = customers;
    chartLabel = 'Customer Count';
    yAxisTitle = 'Number of Customers';
  } else {
    chartData = averages;
    chartLabel = 'Average Sale';
    yAxisTitle = 'Average Sale Amount';
  }
  
  charts.branchChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: branches,
      datasets: [
        {
          label: chartLabel,
          data: chartData,
          backgroundColor: branches.map((branch, index) => {
            // Create different shades for each bar
            const colors = [
              'rgba(79, 70, 229, 0.8)',
              'rgba(99, 102, 241, 0.8)',
              'rgba(129, 140, 248, 0.8)',
              'rgba(165, 180, 252, 0.8)',
              'rgba(199, 210, 254, 0.8)'
            ];
            return colors[index % colors.length];
          }),
          borderColor: '#4f46e5',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              size: 12,
              family: "'Inter', sans-serif"
            },
            color: '#374151'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#4f46e5',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              const branch = branches[index];
              const branchInfo = branchData[branch];
              
              const labels = [
                `Total Sales: ${formatNumber(branchInfo.totalSales)}`,
                `Customers: ${formatNumber(branchInfo.totalCustomers)}`,
                `Average Sale: ${formatNumber(branchInfo.averageSalePerCustomer, 2)}`,
                `Daily Average: ${formatNumber(branchInfo.dailyAverageSales)}`
              ];
              
              return labels;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
              size: 11
            },
            color: '#374151'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
              size: 11
            },
            color: '#6b7280',
            callback: function(value) {
              return formatNumber(value);
            }
          },
          title: {
            display: true,
            text: yAxisTitle,
            color: '#374151',
            font: {
              family: "'Inter', sans-serif",
              size: 12,
              weight: '600'
            }
          }
        }
      }
    }
  });
  
  // Update branch metrics
  if (branches.length > 0) {
    // Top performing branch by sales
    document.getElementById('top-branch').textContent = 
      `${branches[0]} (${formatNumber(sales[0])})`;
    
    // Highest average sale per customer
    let highestAvgIndex = 0;
    let highestAvgValue = averages[0];
    averages.forEach((avg, index) => {
      if (avg > highestAvgValue) {
        highestAvgValue = avg;
        highestAvgIndex = index;
      }
    });
    document.getElementById('highest-average').textContent = 
      `${branches[highestAvgIndex]} (${formatNumber(highestAvgValue, 2)})`;
    
    // Most customers
    let mostCustomersIndex = 0;
    let mostCustomersValue = customers[0];
    customers.forEach((cust, index) => {
      if (cust > mostCustomersValue) {
        mostCustomersValue = cust;
        mostCustomersIndex = index;
      }
    });
    document.getElementById('most-customers').textContent = 
      `${branches[mostCustomersIndex]} (${formatNumber(mostCustomersValue)})`;
  }
  
  console.log("✅ Branch chart rendered with", branches.length, "branches");
}