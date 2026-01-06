function exportToExcel() {
  try {
    const filteredData = filterData();
    if (!filteredData || filteredData.length === 0) {
      showError('No data available to export!');
      return;
    }
    
    console.log(`Exporting ${filteredData.length} records to Excel`);
    
    // Prepare data for export (without $ signs)
    const exportData = filteredData.map(row => ({
      'Date': row.date,
      'Branch': row.branch,
      'Total Sales': parseFloat(row['Total Sales'] || 0).toFixed(2),
      'Total Customers': parseInt(row['Total Customers'] || 0),
      'Retail Sales': parseFloat(row['Retail Sales'] || 0).toFixed(2),
      'Retail Customers': parseInt(row['Retail Customers'] || 0),
      'Liquor Sales': parseFloat(row['Liquor Sales'] || 0).toFixed(2),
      'Liquor Customers': parseInt(row['Liquor Customers'] || 0),
      'Deli Sales': parseFloat(row['Deli Sales'] || 0).toFixed(2),
      'Deli Customers': parseInt(row['Deli Customers'] || 0),
      'Wholesale Sales': parseFloat(row['Wholesale Sales'] || 0).toFixed(2),
      'Wholesale Customers': parseInt(row['Wholesale Customers'] || 0),
      'Pharmacy Sales': parseFloat(row['Pharmacy Sales'] || 0).toFixed(2),
      'Pharmacy Customers': parseInt(row['Pharmacy Customers'] || 0)
    }));
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Format column widths
    const wscols = [
      {wch: 12}, // Date
      {wch: 15}, // Branch
      {wch: 15}, // Total Sales
      {wch: 15}, // Total Customers
      {wch: 15}, // Retail Sales
      {wch: 15}, // Retail Customers
      {wch: 15}, // Liquor Sales
      {wch: 15}, // Liquor Customers
      {wch: 15}, // Deli Sales
      {wch: 15}, // Deli Customers
      {wch: 15}, // Wholesale Sales
      {wch: 15}, // Wholesale Customers
      {wch: 15}, // Pharmacy Sales
      {wch: 15}  // Pharmacy Customers
    ];
    ws['!cols'] = wscols;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Data');
    
    // Add summary sheet
    const kpis = computeKPIs(filteredData);
    const summaryData = [
      ['Sales Dashboard Export Summary'],
      [''],
      ['Export Date', new Date().toLocaleString()],
      ['Branch Filter', AppState.branch === 'ALL' ? 'All Branches' : AppState.branch],
      ['Date Range', `${AppState.startDate} to ${AppState.endDate}`],
      [''],
      ['Summary Statistics'],
      ['Total Records Exported', filteredData.length],
      ['Total Sales', formatNumber(kpis.totalSales)],
      ['Total Customers', formatNumber(kpis.totalCustomers)],
      ['Average Sale per Customer', formatNumber(kpis.averageSalePerCustomer, 2)],
      ['Daily Average Sales', formatNumber(kpis.dailyAverageSales)],
      ['Conversion Rate', kpis.conversionRate.toFixed(1)]
    ];
    
    const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `Sales_Export_${timestamp}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
    
    showSuccess('✅ Data exported to Excel successfully!');
  } catch (error) {
    console.error('Excel export error:', error);
    showError('❌ Failed to export to Excel. Please try again.');
  }
}

function exportToPDF() {
  try {
    const filteredData = filterData();
    if (!filteredData || filteredData.length === 0) {
      showError('No data available to export!');
      return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
    const timestamp = new Date().toLocaleString();
    const kpis = computeKPIs(filteredData);
    const branchName = AppState.branch === 'ALL' ? 'All Branches' : AppState.branch;
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text('Sales Dashboard Report', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${timestamp}`, 20, 30);
    doc.text(`Branch: ${branchName}`, 20, 35);
    doc.text(`Date Range: ${AppState.startDate || 'Any'} to ${AppState.endDate || 'Any'}`, 20, 40);
    doc.text(`Records: ${filteredData.length}`, 20, 45);
    
    // Add KPIs (without $ signs)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Performance Summary', 20, 60);
    
    doc.setFontSize(10);
    let yPos = 70;
    doc.text(`Total Sales: ${formatNumber(kpis.totalSales)}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Customers: ${formatNumber(kpis.totalCustomers)}`, 20, yPos);
    yPos += 7;
    doc.text(`Average per Customer: ${formatNumber(kpis.averageSalePerCustomer, 2)}`, 20, yPos);
    yPos += 7;
    doc.text(`Daily Average: ${formatNumber(kpis.dailyAverageSales)}`, 20, yPos);
    yPos += 7;
    doc.text(`Conversion Rate: ${kpis.conversionRate.toFixed(1)}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Days: ${kpis.totalDays}`, 20, yPos);
    
    // Add department breakdown
    yPos += 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Department Performance', 20, yPos);
    
    yPos += 10;
    const deptData = getDepartmentBreakdown(filteredData);
    Object.entries(deptData).forEach(([dept, data]) => {
      doc.setFontSize(10);
      doc.text(`${dept}: ${formatNumber(data.sales)} (${data.percentage.toFixed(1)}%)`, 20, yPos);
      yPos += 7;
    });
    
    // Add branch comparison if applicable
    if (AppState.branch === 'ALL') {
      yPos += 10;
      doc.setFontSize(12);
      doc.text('Top Performing Branches', 20, yPos);
      
      yPos += 10;
      const branchData = getBranchComparison(filteredData);
      const topBranches = Object.entries(branchData)
        .sort((a, b) => b[1].totalSales - a[1].totalSales)
        .slice(0, 5);
      
      topBranches.forEach(([branch, data], index) => {
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${branch}: ${formatNumber(data.totalSales)}`, 20, yPos);
        yPos += 7;
      });
    }
    
    // Generate filename with timestamp
    const filename = `Sales_Report_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`;
    
    // Save PDF
    doc.save(filename);
    
    showSuccess('✅ Report exported to PDF successfully!');
  } catch (error) {
    console.error('PDF export error:', error);
    showError('❌ Failed to export to PDF. Please try again.');
  }
}

function exportChart() {
  try {
    const currentView = AppState.currentView;
    let chart;
    
    // Determine which chart to export based on current view
    switch(currentView) {
      case 'overview':
        chart = charts.salesTrendChart || charts.customerTrendChart;
        break;
      case 'branch-performance':
        chart = charts.branchChart;
        break;
      case 'sales-analysis':
        chart = charts.departmentChart || charts.dailyPatternChart;
        break;
      case 'customer-insights':
        chart = charts.customerDepartmentChart || charts.avgSaleChart;
        break;
      case 'department-performance':
        chart = charts.performanceChart;
        break;
      default:
        chart = charts.salesTrendChart;
    }
    
    if (!chart) {
      showError('No chart available to export!');
      return;
    }
    
    // Get chart canvas
    const canvas = chart.canvas;
    
    // Create download link
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    link.download = `Sales_Chart_${currentView}_${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('✅ Chart exported as image successfully!');
  } catch (error) {
    console.error('Chart export error:', error);
    showError('❌ Failed to export chart. Please try again.');
  }
}

// Make functions globally available
window.exportToExcel = exportToExcel;
window.exportToPDF = exportToPDF;
window.exportChart = exportChart;