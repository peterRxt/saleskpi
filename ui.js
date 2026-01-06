async function init() {
  console.log("🚀 Starting dashboard initialization...");
  
  try {
    showLoading(true);
    
    // Fetch data from API
    let rawData = [];
    try {
      console.log("📡 Fetching data from API...");
      rawData = await fetchData();
      console.log(`📊 Raw data received: ${rawData?.length || 0} items`);
      
      if (rawData && rawData.length > 0) {
        console.log("Sample raw data entry:", rawData[0]);
      }
    } catch (error) {
      console.error("❌ API fetch error:", error);
      showWarning("⚠️ Using test data (API not available)");
    }
    
    // Normalize and validate data
    console.log("🔄 Normalizing data...");
    AppState.data = normalizeData(rawData);
    AppState.lastUpdated = new Date();
    
    console.log(`✅ Loaded ${AppState.data.length} records`);
    
    if (AppState.data.length === 0) {
      showError("No data available. Using test data for demonstration.");
      AppState.data = generateTestData();
      console.log(`📊 Generated ${AppState.data.length} test records`);
    }
    
    // Log data statistics for debugging
    const totalSales = AppState.data.reduce((sum, row) => sum + (parseFloat(row['Total Sales']) || 0), 0);
    const totalCustomers = AppState.data.reduce((sum, row) => sum + (parseInt(row['Total Customers']) || 0), 0);
    console.log(`📈 Data Statistics:`);
    console.log(`   Total Sales: ${formatNumber(totalSales)}`);
    console.log(`   Total Customers: ${formatNumber(totalCustomers)}`);
    console.log(`   Records: ${AppState.data.length}`);
    
    // Find unique dates
    const dates = [...new Set(AppState.data.map(r => r.date))].sort();
    console.log(`📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
    console.log(`📅 Unique dates: ${dates.length}`);
    
    // Setup all UI components FIRST
    setupBranchFilter();
    setupDateFilters();
    setupMenuNavigation();
    setupExportButtons();
    setupFilterButtons();
    setupSortingControls();
    
    // Set default date range to show ALL data initially
    setDefaultDateRange();
    
    // Initialize with overview view
    showView('overview');
    
    // Force immediate dashboard update
    updateDashboard();
    
    // Update data info
    updateDataInfo();
    
    showSuccess(`✅ Dashboard loaded successfully! Found ${AppState.data.length} records.`);
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
    showError(`❌ Failed to load dashboard: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

function setDefaultDateRange() {
  // Find the date range in the data
  const dates = AppState.data.map(r => new Date(r.date)).filter(d => !isNaN(d.getTime()));
  
  if (dates.length > 0) {
    const maxDate = new Date(Math.max(...dates));
    const minDate = new Date(Math.min(...dates));
    
    console.log(`📅 Data date range: ${minDate.toDateString()} to ${maxDate.toDateString()}`);
    
    // Set default to show ALL data initially (no date filtering)
    AppState.startDate = null;
    AppState.endDate = null;
    
    // Update date inputs to show the full range
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
      startDateInput.value = minDate.toISOString().split('T')[0];
      startDateInput.min = minDate.toISOString().split('T')[0];
      startDateInput.max = maxDate.toISOString().split('T')[0];
    }
    
    if (endDateInput) {
      endDateInput.value = maxDate.toISOString().split('T')[0];
      endDateInput.min = minDate.toISOString().split('T')[0];
      endDateInput.max = maxDate.toISOString().split('T')[0];
    }
    
    console.log(`📅 Setting date inputs: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
  } else {
    // Fallback to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    AppState.startDate = startDate.toISOString().split('T')[0];
    AppState.endDate = endDate.toISOString().split('T')[0];
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) startDateInput.value = AppState.startDate;
    if (endDateInput) endDateInput.value = AppState.endDate;
    
    console.log(`📅 Fallback date range: ${AppState.startDate} to ${AppState.endDate}`);
  }
}

function updateDashboard() {
  console.log("🔄 Updating dashboard for view:", AppState.currentView);
  
  // Get filtered data based on current filters
  const filteredData = filterData();
  
  console.log(`📊 Filtered data: ${filteredData.length} records`);
  
  if (filteredData.length === 0) {
    console.warn("⚠️ No data available for selected filters");
    showWarning("⚠️ No data available for selected filters. Try adjusting date range or branch selection.");
    
    // Reset KPIs to 0
    document.getElementById('kpi-sales').textContent = '0';
    document.getElementById('kpi-customers').textContent = '0';
    document.getElementById('kpi-average').textContent = '0';
    document.getElementById('kpi-daily-avg').textContent = '0';
    
    // Clear all charts for current view
    destroyAllCharts();
    
    // Show empty states for current view charts
    const viewId = `${AppState.currentView}-view`;
    const viewElement = document.getElementById(viewId);
    if (viewElement) {
      const canvases = viewElement.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        createEmptyState(canvas.id, 'No data available');
      });
    }
    
    return;
  }
  
  // Calculate KPIs
  const kpis = computeKPIs(filteredData);
  
  console.log("📈 KPIs calculated:", {
    totalSales: kpis.totalSales,
    totalCustomers: kpis.totalCustomers,
    averageSalePerCustomer: kpis.averageSalePerCustomer,
    dailyAverageSales: kpis.dailyAverageSales
  });
  
  // Update KPI displays (no $ signs)
  document.getElementById('kpi-sales').textContent = formatNumber(kpis.totalSales);
  document.getElementById('kpi-customers').textContent = formatNumber(kpis.totalCustomers);
  document.getElementById('kpi-average').textContent = formatNumber(kpis.averageSalePerCustomer, 2);
  document.getElementById('kpi-daily-avg').textContent = formatNumber(kpis.dailyAverageSales);
  
  // Always render all charts for the current view
  renderCharts(filteredData, AppState.currentView);
  
  // Update data info in sidebar
  updateDataInfo();
}

function setupDateFilters() {
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (!startDateInput || !endDateInput) return;
  
  // Get date range from data
  const dates = AppState.data.map(r => new Date(r.date)).filter(d => !isNaN(d.getTime()));
  if (dates.length > 0) {
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Format dates for input fields (YYYY-MM-DD)
    const formatForInput = date => date.toISOString().split('T')[0];
    
    // Set min and max dates
    startDateInput.min = formatForInput(minDate);
    startDateInput.max = formatForInput(maxDate);
    endDateInput.min = formatForInput(minDate);
    endDateInput.max = formatForInput(maxDate);
    
    console.log(`📅 Date filter setup: ${startDateInput.min} to ${endDateInput.max}`);
  }
  
  // Add event listeners for real-time filtering
  startDateInput.addEventListener('change', function() {
    console.log(`📅 Start date changed to: ${this.value}`);
    AppState.startDate = this.value;
    updateDashboard();
  });
  
  endDateInput.addEventListener('change', function() {
    console.log(`📅 End date changed to: ${this.value}`);
    AppState.endDate = this.value;
    updateDashboard();
  });
}

function setupFilterButtons() {
  const applyBtn = document.getElementById('applyFilters');
  const resetBtn = document.getElementById('resetFilters');
  
  if (applyBtn) {
    applyBtn.addEventListener('click', function() {
      console.log("✅ Apply filters button clicked");
      
      const branchSelect = document.getElementById('branchFilter');
      const startDateInput = document.getElementById('startDate');
      const endDateInput = document.getElementById('endDate');
      
      // Update state
      AppState.branch = branchSelect.value;
      AppState.startDate = startDateInput.value;
      AppState.endDate = endDateInput.value;
      
      console.log(`🎯 Applying filters - Branch: ${AppState.branch}, Dates: ${AppState.startDate} to ${AppState.endDate}`);
      
      // Update dashboard
      updateDashboard();
      
      showSuccess("✅ Filters applied successfully!");
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      console.log("🔄 Reset filters button clicked");
      
      // Reset to show ALL data
      const branchSelect = document.getElementById('branchFilter');
      branchSelect.value = "ALL";
      
      // Get all dates from data
      const dates = AppState.data.map(r => new Date(r.date)).filter(d => !isNaN(d.getTime()));
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        startDateInput.value = minDate.toISOString().split('T')[0];
        endDateInput.value = maxDate.toISOString().split('T')[0];
        
        AppState.startDate = null; // Reset to show all
        AppState.endDate = null;   // Reset to show all
      }
      
      // Update state
      AppState.branch = "ALL";
      
      // Update dashboard
      updateDashboard();
      
      showSuccess("🔄 Filters reset to show all data!");
    });
  }
  
  // Setup period selector
  const periodSelect = document.getElementById('chartPeriod');
  if (periodSelect) {
    periodSelect.addEventListener('change', function() {
      console.log(`📊 Period changed to: ${this.value}`);
      updateDashboard();
    });
  }
  
  console.log("✅ Filter buttons setup complete");
}