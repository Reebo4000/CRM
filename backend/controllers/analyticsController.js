const { Op } = require('sequelize');
const { Order, OrderItem, Customer, Product, sequelize } = require('../models');
const PDFDocument = require('pdfkit');
const {
  formatCurrencyForPDF,
  formatNumberForPDF,
  formatDateForPDF,
  toArabicNumerals
} = require('../utils/pdfArabicUtils');

/**
 * Get sales analytics data
 */
const getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    
    // Set default date range (last 30 days)
    const end = endDate ? new Date(endDate) : new Date( Date.now() + 1 * 24 * 60 * 60 * 1000);
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const whereClause = {
      orderDate: {
        [Op.between]: [start, end]
      },
      status: { [Op.ne]: 'cancelled' }
    };

    // Revenue trends based on period (PostgreSQL compatible)
    let dateFormat;
    switch (period) {
      case 'hourly':
        dateFormat = 'YYYY-MM-DD HH24:00:00';
        break;
      case 'daily':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'weekly':
        dateFormat = 'YYYY-WW';
        break;
      case 'monthly':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    // Revenue trends
    const revenueTrends = await Order.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('TO_CHAR', sequelize.col('orderDate'), dateFormat), 'period'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      group: [sequelize.fn('TO_CHAR', sequelize.col('orderDate'), dateFormat)],
      order: [[sequelize.fn('TO_CHAR', sequelize.col('orderDate'), dateFormat), 'ASC']],
      raw: true
    });

    // Current period totals
    const currentPeriodStats = await Order.findOne({
      where: whereClause,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('AVG', sequelize.col('totalAmount')), 'averageOrderValue']
      ],
      raw: true
    });

    // Previous period for comparison
    const periodDiff = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodDiff);
    const prevEnd = new Date(start.getTime());

    const previousPeriodStats = await Order.findOne({
      where: {
        orderDate: {
          [Op.between]: [prevStart, prevEnd]
        },
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('AVG', sequelize.col('totalAmount')), 'averageOrderValue']
      ],
      raw: true
    });

    // Sales by category
    const salesByCategory = await OrderItem.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['category']
        },
        {
          model: Order,
          as: 'order',
          where: whereClause,
          attributes: []
        }
      ],
      attributes: [
        [sequelize.col('product.category'), 'category'],
        [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('OrderItem.totalPrice')), 'totalRevenue']
      ],
      group: ['product.category'],
      order: [[sequelize.fn('SUM', sequelize.col('OrderItem.totalPrice')), 'DESC']],
      raw: true
    });

    // Top selling products
    const topProducts = await OrderItem.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'price']
        },
        {
          model: Order,
          as: 'order',
          where: whereClause,
          attributes: []
        }
      ],
      attributes: [
        [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('OrderItem.totalPrice')), 'totalRevenue']
      ],
      group: ['product.id', 'product.name', 'product.category', 'product.price'],
      order: [[sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({
      message: 'Sales analytics retrieved successfully',
      data: {
        revenueTrends: revenueTrends.map(item => ({
          period: item.period,
          revenue: parseFloat(item.revenue || 0),
          orderCount: parseInt(item.orderCount || 0)
        })),
        currentPeriod: {
          totalRevenue: parseFloat(currentPeriodStats.totalRevenue || 0),
          totalOrders: parseInt(currentPeriodStats.totalOrders || 0),
          averageOrderValue: parseFloat(currentPeriodStats.averageOrderValue || 0)
        },
        previousPeriod: {
          totalRevenue: parseFloat(previousPeriodStats.totalRevenue || 0),
          totalOrders: parseInt(previousPeriodStats.totalOrders || 0),
          averageOrderValue: parseFloat(previousPeriodStats.averageOrderValue || 0)
        },
        salesByCategory: salesByCategory.map(item => ({
          category: item.category,
          totalQuantity: parseInt(item.totalQuantity || 0),
          totalRevenue: parseFloat(item.totalRevenue || 0)
        })),
        topProducts: topProducts.map(item => ({
          id: item['product.id'],
          name: item['product.name'],
          category: item['product.category'],
          price: parseFloat(item['product.price']),
          totalQuantity: parseInt(item.totalQuantity || 0),
          totalRevenue: parseFloat(item.totalRevenue || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve sales analytics',
      message: 'Internal server error'
    });
  }
};

/**
 * Get customer analytics data
 */
const getCustomerAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Customer acquisition trends
    const customerAcquisition = await Customer.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'newCustomers']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Customer lifetime value
    const customerLTV = await Customer.findAll({
      include: [
        {
          model: Order,
          as: 'orders',
          where: { status: { [Op.ne]: 'cancelled' } },
          attributes: []
        }
      ],
      attributes: [
        'id',
        [sequelize.fn('SUM', sequelize.col('orders.totalAmount')), 'totalSpent'],
        [sequelize.fn('COUNT', sequelize.col('orders.id')), 'orderCount']
      ],
      group: ['Customer.id'],
      having: sequelize.where(sequelize.fn('COUNT', sequelize.col('orders.id')), '>', 0),
      raw: true
    });

    // Calculate average CLV
    const avgCLV = customerLTV.length > 0 
      ? customerLTV.reduce((sum, customer) => sum + parseFloat(customer.totalSpent), 0) / customerLTV.length
      : 0;

    // Customer segmentation (by purchase frequency)
    const customerSegmentation = {
      newCustomers: customerLTV.filter(c => parseInt(c.orderCount) === 1).length,
      returningCustomers: customerLTV.filter(c => parseInt(c.orderCount) > 1 && parseInt(c.orderCount) <= 5).length,
      loyalCustomers: customerLTV.filter(c => parseInt(c.orderCount) > 5).length
    };

    // Repeat purchase rate
    const totalCustomersWithOrders = customerLTV.length;
    const customersWithMultipleOrders = customerLTV.filter(c => parseInt(c.orderCount) > 1).length;
    const repeatPurchaseRate = totalCustomersWithOrders > 0 
      ? (customersWithMultipleOrders / totalCustomersWithOrders) * 100 
      : 0;

    res.json({
      message: 'Customer analytics retrieved successfully',
      data: {
        customerAcquisition: customerAcquisition.map(item => ({
          date: item.date,
          newCustomers: parseInt(item.newCustomers)
        })),
        averageCustomerLifetimeValue: parseFloat(avgCLV.toFixed(2)),
        customerSegmentation,
        repeatPurchaseRate: parseFloat(repeatPurchaseRate.toFixed(2)),
        totalCustomersWithOrders
      }
    });
  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve customer analytics',
      message: 'Internal server error'
    });
  }
};

/**
 * Get product analytics data
 */
const getProductAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Inventory performance
    const inventoryPerformance = await Product.findAll({
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Order,
              as: 'order',
              where: {
                orderDate: { [Op.between]: [start, end] },
                status: { [Op.ne]: 'cancelled' }
              },
              attributes: []
            }
          ],
          attributes: []
        }
      ],
      attributes: [
        'id',
        'name',
        'category',
        'stockQuantity',
        'price',
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('orderItems.quantity')), 0), 'totalSold'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('orderItems.totalPrice')), 0), 'totalRevenue']
      ],
      group: ['Product.id', 'Product.name', 'Product.category', 'Product.stockQuantity', 'Product.price'],
      order: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('orderItems.quantity')), 0), 'DESC']],
      raw: true
    });

    // Low stock products (stock <= 10)
    const lowStockProducts = inventoryPerformance.filter(product => product.stockQuantity <= 10);

    // Fast vs slow moving products
    const avgSales = inventoryPerformance.reduce((sum, p) => sum + parseInt(p.totalSold), 0) / inventoryPerformance.length;
    const fastMoving = inventoryPerformance.filter(p => parseInt(p.totalSold) > avgSales);
    const slowMoving = inventoryPerformance.filter(p => parseInt(p.totalSold) <= avgSales);

    // Category performance
    const categoryPerformance = await Product.findAll({
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Order,
              as: 'order',
              where: {
                orderDate: { [Op.between]: [start, end] },
                status: { [Op.ne]: 'cancelled' }
              },
              attributes: []
            }
          ],
          attributes: []
        }
      ],
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('Product.id')), 'productCount'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('orderItems.quantity')), 0), 'totalSold'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('orderItems.totalPrice')), 0), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('Product.price')), 'avgPrice']
      ],
      group: ['category'],
      order: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('orderItems.totalPrice')), 0), 'DESC']],
      raw: true
    });

    res.json({
      message: 'Product analytics retrieved successfully',
      data: {
        inventoryPerformance: inventoryPerformance.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          stockQuantity: product.stockQuantity,
          price: parseFloat(product.price),
          totalSold: parseInt(product.totalSold),
          totalRevenue: parseFloat(product.totalRevenue)
        })),
        lowStockProducts: lowStockProducts.length,
        fastMovingProducts: fastMoving.length,
        slowMovingProducts: slowMoving.length,
        categoryPerformance: categoryPerformance.map(cat => ({
          category: cat.category,
          productCount: parseInt(cat.productCount),
          totalSold: parseInt(cat.totalSold),
          totalRevenue: parseFloat(cat.totalRevenue),
          avgPrice: parseFloat(cat.avgPrice)
        }))
      }
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve product analytics',
      message: 'Internal server error'
    });
  }
};

/**
 * Get operational analytics data
 */
const getOperationalAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const whereClause = {
      orderDate: { [Op.between]: [start, end] }
    };

    // Order status distribution
    const orderStatusDistribution = await Order.findAll({
      where: whereClause,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Peak sales analysis (by hour and day of week) - PostgreSQL compatible
    const peakSalesHours = await Order.findAll({
      where: {
        ...whereClause,
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM "orderDate"')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      group: [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM "orderDate"'))],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });

    const peakSalesDays = await Order.findAll({
      where: {
        ...whereClause,
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal('DOW FROM "orderDate"')), 'dayOfWeek'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      group: [sequelize.fn('EXTRACT', sequelize.literal('DOW FROM "orderDate"'))],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });

    // Average order processing time (for completed orders) - PostgreSQL compatible
    const processingTimes = await Order.findAll({
      where: {
        ...whereClause,
        status: 'completed'
      },
      attributes: [
        [sequelize.fn('AVG',
          sequelize.fn('EXTRACT',
            sequelize.literal('EPOCH FROM ("updatedAt" - "orderDate")')
          )
        ), 'avgProcessingSeconds']
      ],
      raw: true
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    res.json({
      message: 'Operational analytics retrieved successfully',
      data: {
        orderStatusDistribution: orderStatusDistribution.map(item => ({
          status: item.status,
          count: parseInt(item.count)
        })),
        peakSalesHours: peakSalesHours.map(item => ({
          hour: parseInt(item.hour),
          orderCount: parseInt(item.orderCount)
        })),
        peakSalesDays: peakSalesDays.map(item => ({
          dayOfWeek: dayNames[parseInt(item.dayOfWeek)], // PostgreSQL DOW: 0=Sunday, 1=Monday, etc.
          orderCount: parseInt(item.orderCount)
        })),
        averageProcessingTime: parseFloat((processingTimes[0]?.avgProcessingSeconds || 0) / 3600) // Convert seconds to hours
      }
    });
  } catch (error) {
    console.error('Get operational analytics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve operational analytics',
      message: 'Internal server error'
    });
  }
};

/**
 * Export analytics data to PDF
 */
const exportAnalyticsPDF = async (req, res) => {
  try {
    const { startDate, endDate, reportType = 'overview', language = 'en' } = req.query;

    // Set default date range (last 30 days)
    const end = endDate ? new Date(endDate) : new Date( Date.now() + 1 * 24 * 60 * 60 * 1000);
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Use Arabic-aware date formatting
    const formatDate = (date) => formatDateForPDF(date, language);

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Analytics_Report_${currentDate}.pdf`;

    // Create PDF document with font configuration
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: language === 'ar' ? 'تقرير التحليلات - جيميني CRM' : 'Analytics Report - CRM',
        Author: 'CRM System',
        Subject: language === 'ar' ? 'تقرير التحليلات' : 'Analytics Report',
        Keywords: 'analytics, report, crm'
      }
    });

    // For Arabic PDFs, we'll use a hybrid approach:
    // - English text for clarity and proper rendering
    // - Arabic numerals for numbers
    // - RTL layout positioning
    // - Arabic language indicators

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header with company branding (Arabic-aware)
    const pageWidth = 595; // A4 width in points
    const margin = 50;
    const isArabic = language === 'ar';

    // For Arabic layout, align to the right; for English, align to the left
    const headerAlign = isArabic ? 'right' : 'left';
    const headerX = isArabic ? pageWidth - margin : margin;

    // Company name (keep in English for clarity, but position for Arabic)
    doc.fontSize(24)
       .fillColor('#1f2937')
       .text('CRM', headerX, 50, { align: headerAlign });

    // Add Arabic language indicator if Arabic
    if (isArabic) {
      doc.fontSize(14)
         .fillColor('#6b7280')
         .text('(Arabic / العربية)', headerX, 75, { align: headerAlign });
    }

    // Subtitle
    doc.fontSize(16)
       .fillColor('#6b7280')
       .text('Women\'s Bag Store Management System', headerX, isArabic ? 95 : 80, { align: headerAlign });

    // Report title
    doc.fontSize(20)
       .fillColor('#1f2937')
       .text('Analytics Report', headerX, isArabic ? 125 : 120, { align: headerAlign });

    // Date range and generation info (with Arabic numerals if Arabic)
    const startDateFormatted = formatDate(start);
    const endDateFormatted = formatDate(end);
    const currentDateFormatted = formatDate(new Date());

    const reportPeriodText = `Report Period: ${startDateFormatted} - ${endDateFormatted}`;
    const generatedText = `Generated on: ${currentDateFormatted}`;

    // Convert numbers to Arabic numerals if Arabic language
    const finalReportPeriod = isArabic ? toArabicNumerals(reportPeriodText) : reportPeriodText;
    const finalGenerated = isArabic ? toArabicNumerals(generatedText) : generatedText;

    doc.fontSize(12)
       .fillColor('#6b7280')
       .text(finalReportPeriod, headerX, isArabic ? 155 : 150, { align: headerAlign })
       .text(finalGenerated, headerX, isArabic ? 175 : 170, { align: headerAlign });

    // Add separator line
    const separatorY = isArabic ? 200 : 190;
    doc.moveTo(50, separatorY)
       .lineTo(550, separatorY)
       .strokeColor('#e5e7eb')
       .stroke();

    let yPosition = separatorY + 20;

    // Get analytics data based on report type
    const whereClause = {
      orderDate: { [Op.between]: [start, end] },
      status: { [Op.ne]: 'cancelled' }
    };

    // Key Metrics Section
    const metricsX = isArabic ? pageWidth - margin : margin;
    const metricsAlign = isArabic ? 'right' : 'left';

    doc.fontSize(16)
       .fillColor('#1f2937')
       .text('Key Metrics', metricsX, yPosition, { align: metricsAlign });

    yPosition += 30;

    // Get comprehensive analytics data (similar to Puppeteer version)
    const totalRevenue = await Order.sum('totalAmount', { where: whereClause }) || 0;
    const totalOrders = await Order.count({ where: whereClause });
    const totalCustomers = await Customer.count();
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Previous period comparison (same duration before start date)
    const periodDuration = end.getTime() - start.getTime();
    const previousStartDate = new Date(start.getTime() - periodDuration);
    const previousEndDate = new Date(start.getTime());

    const previousWhereClause = {
      orderDate: { [Op.between]: [previousStartDate, previousEndDate] },
      status: { [Op.ne]: 'cancelled' }
    };

    const previousRevenue = await Order.sum('totalAmount', { where: previousWhereClause }) || 0;
    const previousOrders = await Order.count({ where: previousWhereClause });

    // Calculate growth percentages
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue * 100) : 0;
    const ordersGrowth = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders * 100) : 0;

    // Get additional comprehensive data
    let topProducts = [];
    let categoryPerformance = [];
    let customerSegmentation = [];
    let inventoryAlerts = [];
    let orderStatusDistribution = [];

    try {
      // Top performing products
      topProducts = await sequelize.query(`
        SELECT
          p.id,
          p.name,
          p.category,
          p.price,
          p."stockQuantity",
          COALESCE(SUM(oi.quantity), 0) as "totalSold",
          COALESCE(SUM(oi."totalPrice"), 0) as "totalRevenue"
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi."productId"
        LEFT JOIN orders o ON oi."orderId" = o.id
        WHERE o."orderDate" BETWEEN $1 AND $2 AND o.status != 'cancelled'
        GROUP BY p.id, p.name, p.category, p.price, p."stockQuantity"
        ORDER BY COALESCE(SUM(oi."totalPrice"), 0) DESC
        LIMIT 10
      `, {
        bind: [start, end],
        type: sequelize.QueryTypes.SELECT
      });

      // Category performance
      categoryPerformance = await sequelize.query(`
        SELECT
          p.category,
          COUNT(DISTINCT p.id) as "productCount",
          COALESCE(SUM(oi.quantity), 0) as "totalSold",
          COALESCE(SUM(oi."totalPrice"), 0) as "totalRevenue"
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi."productId"
        LEFT JOIN orders o ON oi."orderId" = o.id
        WHERE o."orderDate" BETWEEN $1 AND $2 AND o.status != 'cancelled'
        GROUP BY p.category
        ORDER BY COALESCE(SUM(oi."totalPrice"), 0) DESC
      `, {
        bind: [start, end],
        type: sequelize.QueryTypes.SELECT
      });

      // Customer segmentation
      customerSegmentation = await sequelize.query(`
        SELECT
          c.id,
          c."firstName",
          c."lastName",
          c.email,
          COUNT(o.id) as "orderCount",
          SUM(o."totalAmount") as "totalSpent"
        FROM customers c
        INNER JOIN orders o ON c.id = o."customerId"
        WHERE o.status != 'cancelled'
        GROUP BY c.id, c."firstName", c."lastName", c.email
        HAVING COUNT(o.id) > 0
        ORDER BY SUM(o."totalAmount") DESC
        LIMIT 10
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      // Inventory alerts
      inventoryAlerts = await Product.findAll({
        where: { stockQuantity: { [Op.lte]: 10 } },
        attributes: ['id', 'name', 'category', 'stockQuantity', 'price'],
        order: [['stockQuantity', 'ASC']],
        limit: 10,
        raw: true
      });

      // Order status distribution
      orderStatusDistribution = await Order.findAll({
        where: { orderDate: { [Op.between]: [start, end] } },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

    } catch (error) {
      console.log('Some comprehensive data queries failed, continuing with basic data:', error.message);
    }

    // Add key metrics with growth indicators
    const formatGrowth = (growth) => {
      if (!growth || growth === 0) return '';
      const symbol = growth > 0 ? '↗' : '↘';
      return ` ${symbol} ${Math.abs(growth).toFixed(1)}%`;
    };

    const metrics = [
      {
        label: 'Total Revenue',
        value: formatCurrencyForPDF(totalRevenue, language),
        growth: formatGrowth(revenueGrowth),
        growthColor: revenueGrowth > 0 ? '#059669' : revenueGrowth < 0 ? '#dc2626' : '#6b7280'
      },
      {
        label: 'Total Orders',
        value: formatNumberForPDF(totalOrders || 0, language),
        growth: formatGrowth(ordersGrowth),
        growthColor: ordersGrowth > 0 ? '#059669' : ordersGrowth < 0 ? '#dc2626' : '#6b7280'
      },
      {
        label: 'Total Customers',
        value: formatNumberForPDF(totalCustomers || 0, language),
        growth: '',
        growthColor: '#6b7280'
      },
      {
        label: 'Average Order Value',
        value: formatCurrencyForPDF(avgOrderValue, language),
        growth: '',
        growthColor: '#6b7280'
      }
    ];

    metrics.forEach((metric, index) => {
      const yPos = yPosition + Math.floor(index / 2) * 30;
      const isRightColumn = index % 2 === 1;

      // Calculate positions based on language direction
      let labelX, valueX;

      if (isArabic) {
        // Arabic: Right-to-left layout
        if (isRightColumn) {
          labelX = pageWidth - margin - 250;
          valueX = labelX - 120;
        } else {
          labelX = pageWidth - margin;
          valueX = labelX - 120;
        }
      } else {
        // English: Left-to-right layout
        if (isRightColumn) {
          labelX = margin + 250;
          valueX = labelX + 120;
        } else {
          labelX = margin;
          valueX = labelX + 120;
        }
      }

      doc.fontSize(12)
         .fillColor('#374151')
         .text(`${metric.label}:`, labelX, yPos, { align: metricsAlign })
         .fontSize(14)
         .fillColor('#1f2937')
         .text(metric.value, valueX, yPos, { align: metricsAlign });

      // Add growth indicator if available
      if (metric.growth) {
        doc.fontSize(10)
           .fillColor(metric.growthColor)
           .text(metric.growth, valueX + 80, yPos + 2, { align: metricsAlign });
      }
    });

    yPosition += 80;

    // Growth Analysis Section
    if (revenueGrowth !== 0 || ordersGrowth !== 0) {
      const growthX = isArabic ? pageWidth - margin : margin;

      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Growth Analysis', growthX, yPosition, { align: metricsAlign });

      yPosition += 25;

      // Previous period comparison
      doc.fontSize(12)
         .fillColor('#6b7280')
         .text(`Previous Period: ${formatDate(previousStartDate)} - ${formatDate(previousEndDate)}`, growthX, yPosition, { align: metricsAlign });

      yPosition += 20;

      const growthMetrics = [
        {
          label: 'Revenue Growth',
          current: formatCurrencyForPDF(totalRevenue, language),
          previous: formatCurrencyForPDF(previousRevenue, language),
          growth: formatGrowth(revenueGrowth),
          growthColor: revenueGrowth > 0 ? '#059669' : revenueGrowth < 0 ? '#dc2626' : '#6b7280'
        },
        {
          label: 'Orders Growth',
          current: formatNumberForPDF(totalOrders, language),
          previous: formatNumberForPDF(previousOrders, language),
          growth: formatGrowth(ordersGrowth),
          growthColor: ordersGrowth > 0 ? '#059669' : ordersGrowth < 0 ? '#dc2626' : '#6b7280'
        }
      ];

      growthMetrics.forEach((metric, index) => {
        const yPos = yPosition + index * 25;

        doc.fontSize(11)
           .fillColor('#374151')
           .text(`${metric.label}:`, growthX, yPos, { align: metricsAlign })
           .text(`Current: ${metric.current}`, growthX, yPos + 12, { align: metricsAlign })
           .fillColor('#6b7280')
           .text(`Previous: ${metric.previous}`, growthX + 150, yPos + 12, { align: metricsAlign });

        if (metric.growth) {
          doc.fillColor(metric.growthColor)
             .text(metric.growth, growthX + 300, yPos + 12, { align: metricsAlign });
        }
      });

      yPosition += 70;
    }

    // Add separator line
    doc.moveTo(50, yPosition - 10)
       .lineTo(550, yPosition - 10)
       .strokeColor('#e5e7eb')
       .stroke();

    // Content based on report type
    if (reportType === 'overview' || reportType === 'sales') {
      // Recent Orders Section
      const ordersX = isArabic ? pageWidth - margin : margin;

      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Recent Orders', ordersX, yPosition, { align: metricsAlign });

      yPosition += 30;

      const recentOrders = await Order.findAll({
        where: whereClause,
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['firstName', 'lastName', 'email']
        }],
        order: [['orderDate', 'DESC']],
        limit: 15
      });

      if (recentOrders.length > 0) {
        // Table headers with Arabic support
        const headers = [
          { label: 'Order ID', x: isArabic ? 500 : 50 },
          { label: 'Customer', x: isArabic ? 400 : 120 },
          { label: 'Date', x: isArabic ? 300 : 250 },
          { label: 'Amount', x: isArabic ? 200 : 350 },
          { label: 'Status', x: isArabic ? 100 : 450 }
        ];

        doc.fontSize(10).fillColor('#6b7280');
        headers.forEach(header => {
          doc.text(header.label, header.x, yPosition, { align: metricsAlign });
        });

        yPosition += 20;

        recentOrders.forEach((order, index) => {
          if (yPosition > 700) { // Start new page if needed
            doc.addPage();
            yPosition = 50;
          }

          const rowColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';

          doc.rect(50, yPosition - 5, 500, 20)
             .fillColor(rowColor)
             .fill();

          // Format order data with Arabic support
          // Handle Arabic customer names properly by ensuring proper encoding
          const customerName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim();
          const safeCustomerName = customerName || 'N/A';

          const orderData = [
            { value: `#${formatNumberForPDF(order.id, language)}`, x: isArabic ? 500 : 50 },
            { value: safeCustomerName, x: isArabic ? 400 : 120 },
            { value: formatDate(order.orderDate), x: isArabic ? 300 : 250 },
            { value: formatCurrencyForPDF(order.totalAmount, language), x: isArabic ? 200 : 350 },
            { value: order.status.charAt(0).toUpperCase() + order.status.slice(1), x: isArabic ? 100 : 450 }
          ];

          doc.fontSize(9).fillColor('#374151');
          orderData.forEach(data => {
            doc.text(data.value, data.x, yPosition, { align: metricsAlign });
          });

          yPosition += 20;
        });
      } else {
        doc.fontSize(12)
           .fillColor('#6b7280')
           .text('No orders found for the selected period.', 50, yPosition);
      }

      yPosition += 40;
    }

    // Customer Analytics Section
    if (reportType === 'customers') {
      const customerX = isArabic ? pageWidth - margin : margin;

      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Customer Analytics', customerX, yPosition, { align: metricsAlign });

      yPosition += 30;

      // Get customer data
      const customerStats = await Customer.count();
      const newCustomersThisMonth = await Customer.count({
        where: {
          createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      });

      doc.fontSize(12)
         .fillColor('#374151')
         .text(`Total Customers: ${formatNumberForPDF(customerStats, language)}`, customerX, yPosition, { align: metricsAlign })
         .text(`New Customers (Last 30 days): ${formatNumberForPDF(newCustomersThisMonth, language)}`, customerX, yPosition + 20, { align: metricsAlign });

      yPosition += 60;
    }

    // Product Analytics Section
    if (reportType === 'products') {
      const productX = isArabic ? pageWidth - margin : margin;

      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Product Analytics', productX, yPosition, { align: metricsAlign });

      yPosition += 30;

      // Get product data
      const totalProducts = await Product.count();
      const lowStockProducts = await Product.count({
        where: { stockQuantity: { [Op.lte]: 5 } }
      });
      const outOfStockProducts = await Product.count({
        where: { stockQuantity: { [Op.lte]: 0 } }
      });

      doc.fontSize(12)
         .fillColor('#374151')
         .text(`Total Products: ${formatNumberForPDF(totalProducts, language)}`, productX, yPosition, { align: metricsAlign })
         .text(`Low Stock Products: ${formatNumberForPDF(lowStockProducts, language)}`, productX, yPosition + 20, { align: metricsAlign })
         .text(`Out of Stock Products: ${formatNumberForPDF(outOfStockProducts, language)}`, productX, yPosition + 40, { align: metricsAlign });

      yPosition += 80;
    }

    // Add comprehensive sections for overview and sales reports
    if ((reportType === 'overview' || reportType === 'sales') && topProducts.length > 0) {
      // Check if we need a new page
      if (yPosition > 600) {
        doc.addPage();
        yPosition = 50;
      }

      const productsX = isArabic ? pageWidth - margin : margin;

      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Top Performing Products', productsX, yPosition, { align: metricsAlign });

      yPosition += 30;

      // Table headers
      const productHeaders = [
        { label: 'Product', x: isArabic ? 450 : 50 },
        { label: 'Category', x: isArabic ? 350 : 150 },
        { label: 'Sold', x: isArabic ? 280 : 250 },
        { label: 'Revenue', x: isArabic ? 200 : 320 },
        { label: 'Stock', x: isArabic ? 120 : 420 }
      ];

      doc.fontSize(10).fillColor('#6b7280');
      productHeaders.forEach(header => {
        doc.text(header.label, header.x, yPosition, { align: metricsAlign });
      });

      yPosition += 20;

      topProducts.slice(0, 8).forEach((product, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        const rowColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';

        doc.rect(50, yPosition - 5, 500, 18)
           .fillColor(rowColor)
           .fill();

        const productData = [
          { value: (product.name || '').substring(0, 20), x: isArabic ? 450 : 50 },
          { value: product.category || '', x: isArabic ? 350 : 150 },
          { value: formatNumberForPDF(product.totalSold || 0, language), x: isArabic ? 280 : 250 },
          { value: formatCurrencyForPDF(product.totalRevenue || 0, language), x: isArabic ? 200 : 320 },
          { value: formatNumberForPDF(product.stockQuantity || 0, language), x: isArabic ? 120 : 420 }
        ];

        doc.fontSize(9).fillColor('#374151');
        productData.forEach(data => {
          doc.text(data.value, data.x, yPosition, { align: metricsAlign });
        });

        yPosition += 18;
      });

      yPosition += 20;
    }

    // Add customer insights for overview and customer reports
    if ((reportType === 'overview' || reportType === 'customers') && customerSegmentation.length > 0) {
      // Check if we need a new page
      if (yPosition > 600) {
        doc.addPage();
        yPosition = 50;
      }

      const customersX = isArabic ? pageWidth - margin : margin;

      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Top Customers', customersX, yPosition, { align: metricsAlign });

      yPosition += 30;

      // Table headers
      const customerHeaders = [
        { label: 'Customer', x: isArabic ? 400 : 50 },
        { label: 'Email', x: isArabic ? 280 : 200 },
        { label: 'Orders', x: isArabic ? 180 : 350 },
        { label: 'Total Spent', x: isArabic ? 100 : 420 }
      ];

      doc.fontSize(10).fillColor('#6b7280');
      customerHeaders.forEach(header => {
        doc.text(header.label, header.x, yPosition, { align: metricsAlign });
      });

      yPosition += 20;

      customerSegmentation.slice(0, 8).forEach((customer, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        const rowColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';

        doc.rect(50, yPosition - 5, 500, 18)
           .fillColor(rowColor)
           .fill();

        // Handle Arabic customer names properly
        const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
        const safeCustomerName = customerName || 'N/A';
        const safeEmail = (customer.email || '').substring(0, 25);

        const customerData = [
          { value: safeCustomerName.substring(0, 25), x: isArabic ? 400 : 50 },
          { value: safeEmail, x: isArabic ? 280 : 200 },
          { value: formatNumberForPDF(customer.orderCount || 0, language), x: isArabic ? 180 : 350 },
          { value: formatCurrencyForPDF(customer.totalSpent || 0, language), x: isArabic ? 100 : 420 }
        ];

        doc.fontSize(9).fillColor('#374151');
        customerData.forEach(data => {
          doc.text(data.value, data.x, yPosition, { align: metricsAlign });
        });

        yPosition += 18;
      });

      yPosition += 20;
    }

    // Add inventory alerts for overview and product reports
    if ((reportType === 'overview' || reportType === 'products') && inventoryAlerts.length > 0) {
      // Check if we need a new page
      if (yPosition > 600) {
        doc.addPage();
        yPosition = 50;
      }

      const inventoryX = isArabic ? pageWidth - margin : margin;

      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Inventory Alerts', inventoryX, yPosition, { align: metricsAlign });

      yPosition += 30;

      // Table headers
      const inventoryHeaders = [
        { label: 'Product', x: isArabic ? 400 : 50 },
        { label: 'Category', x: isArabic ? 300 : 180 },
        { label: 'Stock', x: isArabic ? 220 : 280 },
        { label: 'Status', x: isArabic ? 140 : 350 }
      ];

      doc.fontSize(10).fillColor('#6b7280');
      inventoryHeaders.forEach(header => {
        doc.text(header.label, header.x, yPosition, { align: metricsAlign });
      });

      yPosition += 20;

      inventoryAlerts.slice(0, 8).forEach((product, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        const rowColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';

        doc.rect(50, yPosition - 5, 500, 18)
           .fillColor(rowColor)
           .fill();

        const status = product.stockQuantity <= 0 ? 'Out of Stock' :
                      product.stockQuantity <= 5 ? 'Low Stock' : 'Normal';
        const statusColor = product.stockQuantity <= 0 ? '#dc2626' :
                           product.stockQuantity <= 5 ? '#d97706' : '#059669';

        const inventoryData = [
          { value: (product.name || '').substring(0, 20), x: isArabic ? 400 : 50 },
          { value: product.category || '', x: isArabic ? 300 : 180 },
          { value: formatNumberForPDF(product.stockQuantity || 0, language), x: isArabic ? 220 : 280 }
        ];

        doc.fontSize(9).fillColor('#374151');
        inventoryData.forEach(data => {
          doc.text(data.value, data.x, yPosition, { align: metricsAlign });
        });

        // Add status with color
        doc.fillColor(statusColor)
           .text(status, isArabic ? 140 : 350, yPosition, { align: metricsAlign });

        yPosition += 18;
      });

      yPosition += 20;
    }

    // Footer with Arabic support
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 1; i <= pageCount; i++) {
      doc.switchToPage(i - 1); // PDFKit uses 0-based indexing internally

      const pageText = `Page ${formatNumberForPDF(i, language)} of ${formatNumberForPDF(pageCount, language)}`;
      const generatedByText = 'Generated by CRM System';

      const pageX = isArabic ? pageWidth - margin : margin;
      const generatedX = isArabic ? pageWidth - margin : 400;

      doc.fontSize(8)
         .fillColor('#9ca3af')
         .text(pageText, pageX, 750, { align: metricsAlign })
         .text(generatedByText, generatedX, 750, { align: metricsAlign });
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Export analytics PDF error:', error);

    // Check if response has already been sent
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to export analytics report',
        message: error.message || 'Internal server error'
      });
    }
  }
};

module.exports = {
  getSalesAnalytics,
  getCustomerAnalytics,
  getProductAnalytics,
  getOperationalAnalytics,
  exportAnalyticsPDF
};
