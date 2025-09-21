const { Customer, Product, Order, OrderItem, User, sequelize } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { uploadsDir } = require('../middleware/upload');

/**
 * Create a new customer via integration
 */
const createCustomer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { firstName, lastName, email, phone, address, city, postalCode, dateOfBirth } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      where: {
        [Op.or]: [
          email ? { email } : null,
          { phone }
        ].filter(Boolean)
      }
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        error: 'Customer already exists',
        message: 'A customer with this email or phone number already exists',
        customer: existingCustomer
      });
    }

    const customer = await Customer.create({
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      dateOfBirth
    });

    // Trigger notification for new customer registration via integration
    try {
      const notificationTriggers = require('../services/notificationTriggers');
      await notificationTriggers.onCustomerRegistered(customer, null); // Integration doesn't have a specific user
      console.log(`👤 Integration customer registration notification triggered for: ${customer.firstName} ${customer.lastName}`);
    } catch (notificationError) {
      console.error('Error sending integration customer registration notification:', notificationError);
      // Don't fail the customer creation if notifications fail
    }

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    console.error('Integration create customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer',
      message: 'Internal server error'
    });
  }
};

/**
 * Get customer by phone or email
 */
const getCustomer = async (req, res) => {
  try {
    const { phone, email } = req.query;

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameter',
        message: 'Either phone or email parameter is required'
      });
    }

    const whereClause = {};
    if (phone) {
      // Try to find customer with exact phone match first
      // If phone doesn't start with +, also try with + prefix
      const phoneVariations = [phone];
      if (!phone.startsWith('+')) {
        phoneVariations.push('+' + phone);
      }
      whereClause.phone = { [Op.in]: phoneVariations };
    }
    if (email) whereClause.email = email;

    const customer = await Customer.findOne({
      where: whereClause,
      include: [
        {
          model: Order,
          as: 'orders',
          limit: 5,
          order: [['orderDate', 'DESC']],
          include: [
            {
              model: OrderItem,
              as: 'orderItems',
              include: [
                {
                  model: Product,
                  as: 'product',
                  attributes: ['id', 'name', 'category']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        message: 'No customer found with the provided phone or email'
      });
    }

    res.json({
      success: true,
      message: 'Customer retrieved successfully',
      customer
    });
  } catch (error) {
    console.error('Integration get customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customer',
      message: 'Internal server error'
    });
  }
};

/**
 * Create a new product via integration
 */
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { name, description, price, stockQuantity, category, brand, color, material, imagePath, imageUrl } = req.body;

    console.log('🔍 Integration product creation request:', {
      name,
      imagePath: imagePath ? String(imagePath).substring(0, 100) + '...' : null,
      imageUrl: imageUrl ? String(imageUrl).substring(0, 100) + '...' : null,
      hasImagePath: !!imagePath,
      hasImageUrl: !!imageUrl,
      imagePathIsUrl: imagePath ? String(imagePath).startsWith('http') : false,
      imageUrlIsUrl: imageUrl ? String(imageUrl).startsWith('http') : false
    });

    // Check if product already exists
    const existingProduct = await Product.findOne({ where: { name } });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        error: 'Product already exists',
        message: 'A product with this name already exists',
        product: existingProduct
      });
    }

    // Handle image provided as a URL: download and store with original filename
    let storedFilename = null;
    try {
      const candidateUrl = (imageUrl && String(imageUrl).startsWith('http'))
        ? imageUrl
        : (imagePath && String(imagePath).startsWith('http') ? imagePath : null);

      if (candidateUrl) {
        console.log('📥 Downloading image from URL:', candidateUrl);
        const urlObj = new URL(candidateUrl);
        let originalName = decodeURIComponent(path.basename(urlObj.pathname));
        console.log('📄 Original filename from URL:', originalName);

        // If filename is missing, infer extension from content-type
        let inferredExt = '';
        if (!originalName || !path.extname(originalName)) {
          try {
            console.log('🔍 Checking content-type via HEAD request...');
            const headResp = await axios.head(candidateUrl);
            const ct = headResp.headers['content-type'] || '';
            console.log('📋 Content-Type:', ct);
            if (ct.includes('image/jpeg')) inferredExt = '.jpg';
            else if (ct.includes('image/png')) inferredExt = '.png';
            else if (ct.includes('image/gif')) inferredExt = '.gif';
            else if (ct.includes('image/webp')) inferredExt = '.webp';
            else if (ct.includes('image/svg')) inferredExt = '.svg';
          } catch (_) {
            // ignore HEAD errors; we'll still attempt GET
          }
          originalName = originalName && path.extname(originalName) ? originalName : `image${inferredExt || '.jpg'}`;
        }

        let targetPath = path.join(uploadsDir, originalName);
        console.log('💾 Target file path:', targetPath);

        // Avoid overwriting existing files: append a short suffix if needed
        if (fs.existsSync(targetPath)) {
          const base = path.basename(originalName, path.extname(originalName));
          const ext = path.extname(originalName);
          targetPath = path.join(uploadsDir, `${base}-${Date.now()}${ext}`);
          console.log('🔄 File exists, using new path:', targetPath);
        }

        console.log('⬇️ Starting image download...');
        const resp = await axios.get(candidateUrl, { responseType: 'stream' });
        const ctGet = resp.headers['content-type'] || '';
        console.log('📋 Download Content-Type:', ctGet);

        if (!ctGet.startsWith('image/')) {
          return res.status(400).json({
            success: false,
            error: 'Invalid image URL',
            message: 'The provided URL does not point to an image'
          });
        }

        await new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(targetPath);
          resp.data.pipe(writer);
          writer.on('finish', () => {
            console.log('✅ Image download completed:', targetPath);
            resolve();
          });
          writer.on('error', (err) => {
            console.error('❌ Image download failed:', err);
            reject(err);
          });
        });

        storedFilename = path.basename(targetPath);
        console.log('📁 Stored filename:', storedFilename);
      } else if (imagePath) {
        // If a non-URL imagePath was provided, store only the filename part
        storedFilename = path.basename(String(imagePath));
        console.log('📄 Using provided imagePath filename:', storedFilename);
      } else {
        console.log('ℹ️ No image URL provided, imagePath will be null');
      }
    } catch (downloadErr) {
      console.error('❌ Image download error (integration):', downloadErr);
      return res.status(400).json({
        success: false,
        error: 'Image download failed',
        message: 'Failed to download the image from the provided URL'
      });
    }

    console.log('💾 Creating product with imagePath:', storedFilename);
    const product = await Product.create({
      name,
      description,
      price,
      stockQuantity,
      category,
      brand,
      color,
      material,
      imagePath: storedFilename ?? null
    });

    console.log('✅ Product created successfully with imagePath:', product.imagePath);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Integration create product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      message: 'Internal server error'
    });
  }
};

/**
 * Update product inventory
 */
const updateInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, operation = 'set', reason } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity',
        message: 'Quantity must be a non-negative number'
      });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: `Product with ID ${productId} does not exist`
      });
    }

    let newStock;
    const oldStock = product.stockQuantity;

    switch (operation) {
      case 'add':
        newStock = oldStock + parseInt(quantity);
        break;
      case 'subtract':
        newStock = oldStock - parseInt(quantity);
        if (newStock < 0) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient stock',
            message: `Cannot subtract ${quantity} from current stock of ${oldStock}`
          });
        }
        break;
      case 'set':
      default:
        newStock = parseInt(quantity);
        break;
    }

    await product.update({ stockQuantity: newStock });

    // Trigger inventory notifications after integration stock update
    try {
      const notificationTriggers = require('../services/notificationTriggers');
      await notificationTriggers.onStockLevelChange(product, null); // Integration updates don't have a user
      console.log(`📦 Integration stock notifications triggered for ${product.name}: ${oldStock} → ${newStock}`);
    } catch (notificationError) {
      console.error('Error sending integration inventory notifications:', notificationError);
      // Don't fail the stock update if notifications fail
    }

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      product,
      inventoryChange: {
        previousStock: oldStock,
        newStock,
        operation,
        quantity: parseInt(quantity),
        reason: reason || 'Integration update'
      }
    });
  } catch (error) {
    console.error('Integration update inventory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update inventory',
      message: 'Internal server error'
    });
  }
};

/**
 * Create order via integration
 */
const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { customerId, orderItems, notes, customerInfo } = req.body;
    
    let customer;
    
    // If customerId is provided, use it; otherwise create customer from customerInfo
    if (customerId) {
      customer = await Customer.findByPk(customerId);
      if (!customer) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Customer not found',
          message: `Customer with ID ${customerId} does not exist`
        });
      }
    } else if (customerInfo) {
      // Try to find existing customer first
      customer = await Customer.findOne({
        where: {
          [Op.or]: [
            customerInfo.email ? { email: customerInfo.email } : null,
            { phone: customerInfo.phone }
          ].filter(Boolean)
        }
      });

      // Create new customer if not found
      if (!customer) {
        customer = await Customer.create(customerInfo, { transaction });
      }
    } else {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Missing customer information',
        message: 'Either customerId or customerInfo must be provided'
      });
    }

    // Get a default user for integration orders (first admin user)
    const defaultUser = await User.findOne({ where: { role: 'admin' } });
    if (!defaultUser) {
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        error: 'System configuration error',
        message: 'No admin user found for processing integration orders'
      });
    }

    // Verify products and stock
    const productChecks = [];
    for (const item of orderItems) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          message: `Product with ID ${item.productId} does not exist`
        });
      }

      if (product.stockQuantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Insufficient stock',
          message: `Product "${product.name}" has only ${product.stockQuantity} units in stock, but ${item.quantity} requested`
        });
      }

      productChecks.push({ product, requestedQuantity: item.quantity });
    }

    // Create order
    const order = await Order.create({
      customerId: customer.id,
      userId: defaultUser.id,
      orderDate: new Date(),
      totalAmount: 0,
      status: 'pending',
      notes: notes || 'Order created via integration'
    }, { transaction });

    let totalAmount = 0;

    // Create order items and update stock
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      const { product } = productChecks[i];

      const unitPrice = product.price;
      const totalPrice = parseFloat(unitPrice) * item.quantity;
      totalAmount += totalPrice;

      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice
      }, { transaction });

      await product.update({
        stockQuantity: product.stockQuantity - item.quantity
      }, { transaction });
    }

    await order.update({ totalAmount }, { transaction });
    await transaction.commit();

    // Fetch complete order
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: completeOrder
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Integration create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: 'Internal server error'
    });
  }
};

/**
 * Get products with stock information
 */
const getProducts = async (req, res) => {
  try {
    const { category, inStock, limit = 50 } = req.query;

    const whereClause = {};
    if (category) {
      whereClause.category = { [Op.iLike]: `%${category}%` };
    }
    if (inStock === 'true') {
      whereClause.stockQuantity = { [Op.gt]: 0 };
    }

    const products = await Product.findAll({
      where: whereClause,
      limit: parseInt(limit),
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'description', 'price', 'stockQuantity', 'category', 'brand', 'color', 'imagePath']
    });

    res.json({
      success: true,
      message: 'Products retrieved successfully',
      products,
      count: products.length
    });
  } catch (error) {
    console.error('Integration get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve products',
      message: 'Internal server error'
    });
  }
};

/**
 * Health check for integration API
 */
const healthCheck = async (req, res) => {
  res.json({
    success: true,
    message: 'Integration API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};

module.exports = {
  createCustomer,
  getCustomer,
  createProduct,
  updateInventory,
  createOrder,
  getProducts,
  healthCheck
};
