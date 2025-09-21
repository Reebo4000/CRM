const { Op } = require('sequelize');
const { Order, OrderItem, Customer, Product, sequelize } = require('../models');
const puppeteer = require('puppeteer');
const { generateAnalyticsHTML } = require('../utils/pdfHtmlGenerator');

/**
 * Generate PDF using Puppeteer (HTML to PDF)
 * This approach provides excellent support for both Arabic and English text,
 * proper RTL layout, and handles Arabic customer names in English reports
 */
const generateAnalyticsPDF = async (req, res) => {
  try {
    const { startDate, endDate, reportType = 'overview', language = 'en' } = req.query;
    
    // Validate date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    if (start > end) {
      return res.status(400).json({ error: 'Start date cannot be after end date' });
    }

    console.log(`Generating ${reportType} PDF report for ${language} language from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`);

    // Get analytics data
    const analyticsData = await getAnalyticsData(start, end, reportType);
    
    // Prepare data for HTML template
    const templateData = {
      ...analyticsData,
      reportType,
      startDate: start,
      endDate: end
    };

    // Generate HTML content
    const htmlContent = generateAnalyticsHTML(templateData, language);
    
    // Launch Puppeteer with optimized settings
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/home/node/.cache/puppeteer/chrome/linux-138.0.7204.94/chrome-linux64/chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });

    // Set content with optimized wait conditions
    await page.setContent(htmlContent, {
      waitUntil: ['domcontentloaded']
    });

    // Reduced wait time for fonts (1 second instead of 3)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });

    await browser.close();

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const langSuffix = language === 'ar' ? '_Arabic' : '';
    const filename = `Analytics_Report_${reportType}_${dateStr}${langSuffix}.pdf`;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
    
    console.log(`✅ PDF generated successfully: ${filename}`);

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF report',
      details: error.message 
    });
  }
};

/**
 * Get comprehensive analytics data from database
 */
const getAnalyticsData = async (startDate, endDate, reportType) => {
  try {
    // Base analytics data
    const whereClause = {
      orderDate: { [Op.between]: [startDate, endDate] }
    };

    const whereClauseNonCancelled = {
      orderDate: { [Op.between]: [startDate, endDate] },
      status: { [Op.ne]: 'cancelled' }
    };

    const whereClauseCancelled = {
      orderDate: { [Op.between]: [startDate, endDate] },
      status: 'cancelled'
    };

    const totalRevenue = await Order.sum('totalAmount', { where: whereClauseNonCancelled }) || 0;
    const totalOrders = await Order.count({ where: whereClauseNonCancelled });
    const cancelledOrders = await Order.count({ where: whereClauseCancelled });
    const totalCustomers = await Customer.count();
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Previous period comparison (same duration before start date)
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate.getTime());

    const previousWhereClause = {
      orderDate: { [Op.between]: [previousStartDate, previousEndDate] }
    };

    const previousWhereClauseNonCancelled = {
      orderDate: { [Op.between]: [previousStartDate, previousEndDate] },
      status: { [Op.ne]: 'cancelled' }
    };

    const previousRevenue = await Order.sum('totalAmount', { where: previousWhereClauseNonCancelled }) || 0;
    const previousOrders = await Order.count({ where: previousWhereClause });
    const recentOrders = await Order.findAll({
      where: whereClauseNonCancelled,
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['orderDate', 'DESC']],
      limit: 15
    });

    // Calculate growth percentages
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue * 100) : 0;
    const ordersGrowth = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders * 100) : 0;

    // Get comprehensive data for all report types
    let allOrders = [];
    let customerStats = null;
    let newCustomersThisMonth = null;
    let totalProducts = null;
    let lowStockProducts = null;
    let outOfStockProducts = null;
    let salesTrends = [];
    let topProducts = [];
    let categoryPerformance = [];
    let orderStatusDistribution = [];
    let customerSegmentation = [];
    let inventoryAlerts = [];

    // All Orders in date range (for overview and sales reports) - including ALL statuses
    if (reportType === 'overview' || reportType === 'sales') {
      allOrders = await Order.findAll({
        where: {
          orderDate: { [Op.between]: [startDate, endDate] }
          // Removed status filter to include ALL orders regardless of status
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['firstName', 'lastName', 'email']
          },
          {
            model: OrderItem,
            as: 'orderItems',
            attributes: ['quantity']
          }
        ],
        order: [['orderDate', 'DESC']]
        // Removed limit to get ALL orders in the date range
      });

      console.log(`📊 Found ${allOrders.length} orders for ${reportType} report between ${startDate.toISOString().split('T')[0]} and ${endDate.toISOString().split('T')[0]}`);

      // Sales trends (daily revenue for the period)
      salesTrends = await Order.findAll({
        where: whereClauseNonCancelled,
        attributes: [
          [sequelize.fn('DATE', sequelize.col('orderDate')), 'date'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orders']
        ],
        group: [sequelize.fn('DATE', sequelize.col('orderDate'))],
        order: [[sequelize.fn('DATE', sequelize.col('orderDate')), 'ASC']],
        raw: true
      });

      // Order status distribution
      orderStatusDistribution = await Order.findAll({
        where: { orderDate: { [Op.between]: [startDate, endDate] } },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });
    }

    // Customer Analytics
    if (reportType === 'customers' || reportType === 'overview') {
      customerStats = await Customer.count();
      newCustomersThisMonth = await Customer.count({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      });

      // Customer segmentation by order value (simplified query)
      try {
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
      } catch (error) {
        console.log('Customer segmentation query failed, using empty array:', error.message);
        customerSegmentation = [];
      }
    }

    // Product Analytics
    if (reportType === 'products' || reportType === 'overview') {
      totalProducts = await Product.count();
      lowStockProducts = await Product.count({
        where: { stockQuantity: { [Op.lte]: 5 } }
      });
      outOfStockProducts = await Product.count({
        where: { stockQuantity: { [Op.lte]: 0 } }
      });

      // Top performing products (simplified query)
      try {
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
          bind: [startDate, endDate],
          type: sequelize.QueryTypes.SELECT
        });
      } catch (error) {
        console.log('Top products query failed, using empty array:', error.message);
        topProducts = [];
      }

      // Category performance (simplified query)
      try {
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
          bind: [startDate, endDate],
          type: sequelize.QueryTypes.SELECT
        });
      } catch (error) {
        console.log('Category performance query failed, using empty array:', error.message);
        categoryPerformance = [];
      }

      // Inventory alerts (low stock products)
      inventoryAlerts = await Product.findAll({
        where: { stockQuantity: { [Op.lte]: 10 } },
        attributes: ['id', 'name', 'category', 'stockQuantity', 'price'],
        order: [['stockQuantity', 'ASC']],
        limit: 10,
        raw: true
      });
    }

    return {
      // Basic metrics
      totalRevenue,
      totalOrders,
      cancelledOrders,
      totalCustomers,
      avgOrderValue,

      // Growth metrics
      previousRevenue,
      previousOrders,
      revenueGrowth,
      ordersGrowth,

      // Orders data
      allOrders,
      recentOrders,
      salesTrends,
      orderStatusDistribution,

      // Customer data
      customerStats,
      newCustomersThisMonth,
      customerSegmentation,

      // Product data
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      topProducts,
      categoryPerformance,
      inventoryAlerts
    };

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

module.exports = {
  generateAnalyticsPDF
};
