function filterData() {
  if (!AppState.data || AppState.data.length === 0) {
    console.log("⚠️ No data available for filtering");
    return [];
  }
  
  let data = AppState.data;
  const originalCount = data.length;
  
  console.log(`🔍 Starting filter with ${originalCount} total records`);
  console.log(`📊 Current filters - Branch: ${AppState.branch}, Start: ${AppState.startDate}, End: ${AppState.endDate}`);
  
  // Filter by branch
  if (AppState.branch && AppState.branch !== "ALL") {
    const before = data.length;
    data = data.filter(r => r.branch === AppState.branch);
    console.log(`🏬 Branch filter (${AppState.branch}): ${before} → ${data.length} records`);
  }
  
  // Filter by date range
  const start = AppState.startDate ? new Date(AppState.startDate) : null;
  const end = AppState.endDate ? new Date(AppState.endDate) : null;
  
  if (start || end) {
    const before = data.length;
    
    // If both dates are set, filter by range
    if (start && end) {
      data = data.filter(r => {
        try {
          const rowDate = new Date(r.date);
          if (isNaN(rowDate.getTime())) return false;
          
          // Compare dates only (ignore time)
          const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
          const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
          
          return rowDateOnly >= startOnly && rowDateOnly <= endOnly;
        } catch (error) {
          console.error("Date filter error:", error);
          return false;
        }
      });
    }
    // If only start date is set
    else if (start) {
      data = data.filter(r => {
        try {
          const rowDate = new Date(r.date);
          if (isNaN(rowDate.getTime())) return false;
          
          const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
          const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          
          return rowDateOnly >= startOnly;
        } catch (error) {
          console.error("Start date filter error:", error);
          return false;
        }
      });
    }
    // If only end date is set
    else if (end) {
      data = data.filter(r => {
        try {
          const rowDate = new Date(r.date);
          if (isNaN(rowDate.getTime())) return false;
          
          const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
          const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
          
          return rowDateOnly <= endOnly;
        } catch (error) {
          console.error("End date filter error:", error);
          return false;
        }
      });
    }
    
    console.log(`📅 Date filter (${start ? start.toDateString() : 'any'} to ${end ? end.toDateString() : 'any'}): ${before} → ${data.length} records`);
  }
  
  console.log(`✅ Filtered to ${data.length} records (${((data.length / originalCount) * 100).toFixed(1)}%)`);
  return data;
}

function computeKPIs(data) {
  if (!data || data.length === 0) {
    console.log("⚠️ No data for KPI calculation");
    return {
      totalSales: 0,
      totalCustomers: 0,
      averageSalePerCustomer: 0,
      dailyAverageSales: 0,
      conversionRate: 0,
      totalDays: 0,
      totalRecords: 0
    };
  }
  
  console.log(`📈 Computing KPIs from ${data.length} records`);
  
  let totalSales = 0;
  let totalCustomers = 0;
  let totalRecords = data.length;
  
  data.forEach((r, index) => {
    const sales = parseFloat(r['Total Sales']) || 0;
    const customers = parseInt(r['Total Customers']) || 0;
    
    if (!isNaN(sales)) totalSales += sales;
    if (!isNaN(customers)) totalCustomers += customers;
  });
  
  // Calculate average sale per customer
  const averageSalePerCustomer = totalCustomers > 0 ? totalSales / totalCustomers : 0;
  
  // Calculate daily average sales
  const uniqueDays = new Set(data.map(r => {
    try {
      const date = new Date(r.date);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  })).size;
  
  const dailyAverageSales = uniqueDays > 0 ? totalSales / uniqueDays : 0;
  
  // Calculate conversion rate (average customers per day with sales)
  const daysWithSales = new Set(
    data
      .filter(r => parseFloat(r['Total Sales'] || 0) > 0)
      .map(r => {
        try {
          const date = new Date(r.date);
          return date.toISOString().split('T')[0];
        } catch (e) {
          return '';
        }
      })
  ).size;
  
  const conversionRate = daysWithSales > 0 ? totalCustomers / daysWithSales : 0;
  
  console.log("📊 KPI Results:", {
    totalSales: formatNumber(totalSales),
    totalCustomers: formatNumber(totalCustomers),
    averageSalePerCustomer: formatNumber(averageSalePerCustomer, 2),
    dailyAverageSales: formatNumber(dailyAverageSales),
    conversionRate: conversionRate.toFixed(2),
    uniqueDays: uniqueDays,
    totalRecords: totalRecords
  });
  
  return {
    totalSales,
    totalCustomers,
    averageSalePerCustomer,
    dailyAverageSales,
    conversionRate,
    totalDays: uniqueDays,
    totalRecords
  };
}

function getBranchComparison(data) {
  const branchMap = {};
  
  if (!data || data.length === 0) {
    console.log("⚠️ No data for branch comparison");
    return branchMap;
  }
  
  console.log(`🏬 Processing branch comparison for ${data.length} records`);
  
  data.forEach(r => {
    const branch = r.branch || 'Unknown';
    const dayKey = new Date(r.date).toISOString().split('T')[0];
    
    if (!branchMap[branch]) {
      branchMap[branch] = {
        totalSales: 0,
        totalCustomers: 0,
        retailSales: 0,
        retailCustomers: 0,
        liquorSales: 0,
        liquorCustomers: 0,
        deliSales: 0,
        deliCustomers: 0,
        wholesaleSales: 0,
        wholesaleCustomers: 0,
        pharmacySales: 0,
        pharmacyCustomers: 0,
        daysActive: new Set(),
        records: 0
      };
    }
    
    branchMap[branch].daysActive.add(dayKey);
    branchMap[branch].records++;
    
    // Sum all sales and customers
    const sales = parseFloat(r['Total Sales'] || 0);
    const customers = parseInt(r['Total Customers'] || 0);
    
    branchMap[branch].totalSales += sales;
    branchMap[branch].totalCustomers += customers;
    branchMap[branch].retailSales += parseFloat(r['Retail Sales'] || 0);
    branchMap[branch].retailCustomers += parseInt(r['Retail Customers'] || 0);
    branchMap[branch].liquorSales += parseFloat(r['Liquor Sales'] || 0);
    branchMap[branch].liquorCustomers += parseInt(r['Liquor Customers'] || 0);
    branchMap[branch].deliSales += parseFloat(r['Deli Sales'] || 0);
    branchMap[branch].deliCustomers += parseInt(r['Deli Customers'] || 0);
    branchMap[branch].wholesaleSales += parseFloat(r['Wholesale Sales'] || 0);
    branchMap[branch].wholesaleCustomers += parseInt(r['Wholesale Customers'] || 0);
    branchMap[branch].pharmacySales += parseFloat(r['Pharmacy Sales'] || 0);
    branchMap[branch].pharmacyCustomers += parseInt(r['Pharmacy Customers'] || 0);
  });
  
  // Calculate averages and percentages
  Object.keys(branchMap).forEach(branch => {
    const branchData = branchMap[branch];
    branchData.daysActiveCount = branchData.daysActive.size;
    branchData.dailyAverageSales = branchData.daysActiveCount > 0 ? 
      branchData.totalSales / branchData.daysActiveCount : 0;
    branchData.averageSalePerCustomer = branchData.totalCustomers > 0 ? 
      branchData.totalSales / branchData.totalCustomers : 0;
  });
  
  console.log(`✅ Processed ${Object.keys(branchMap).length} branches`);
  return branchMap;
}

function getDepartmentBreakdown(data) {
  const departments = [
    { key: 'Retail', name: 'Retail', color: '#4f46e5' },
    { key: 'Liquor', name: 'Liquor', color: '#10b981' },
    { key: 'Deli', name: 'Deli', color: '#f59e0b' },
    { key: 'Wholesale', name: 'Wholesale', color: '#3b82f6' },
    { key: 'Pharmacy', name: 'Pharmacy', color: '#8b5cf6' }
  ];
  
  const departmentTotals = {};
  let totalSales = 0;
  let totalCustomers = 0;
  
  console.log(`📊 Processing department breakdown for ${data.length} records`);
  
  // Initialize department totals
  departments.forEach(dept => {
    departmentTotals[dept.name] = {
      name: dept.name,
      sales: 0,
      customers: 0,
      color: dept.color,
      percentage: 0,
      averageSale: 0,
      dailyAverage: 0
    };
  });
  
  // Sum up sales and customers for each department
  data.forEach(r => {
    let rowTotalSales = 0;
    let rowTotalCustomers = 0;
    
    departments.forEach(dept => {
      const salesKey = `${dept.key} Sales`;
      const customersKey = `${dept.key} Customers`;
      
      const sales = parseFloat(r[salesKey] || 0);
      const customers = parseInt(r[customersKey] || 0);
      
      departmentTotals[dept.name].sales += sales;
      departmentTotals[dept.name].customers += customers;
      
      rowTotalSales += sales;
      rowTotalCustomers += customers;
    });
    
    totalSales += rowTotalSales;
    totalCustomers += rowTotalCustomers;
  });
  
  // Calculate percentages and averages
  const uniqueDays = new Set(data.map(r => {
    try {
      const date = new Date(r.date);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  })).size;
  
  departments.forEach(dept => {
    const deptData = departmentTotals[dept.name];
    deptData.percentage = totalSales > 0 ? (deptData.sales / totalSales) * 100 : 0;
    deptData.averageSale = deptData.customers > 0 ? deptData.sales / deptData.customers : 0;
    deptData.dailyAverage = uniqueDays > 0 ? deptData.sales / uniqueDays : 0;
  });
  
  console.log("✅ Department breakdown calculated:", departmentTotals);
  return departmentTotals;
}