const { Product, OrderItem, Order } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { deleteFile, getFullPath } = require('../middleware/upload');
const path = require('path');
const db = require('../models');
const sequelize = db.sequelize;
const notificationTriggers = require('../services/notificationTriggers');

/**
 * Get all products with pagination, search, and filtering
 */
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Parse page and limit to integers
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const whereClause = {};
    
    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by category
    if (category) {
      whereClause.category = { [Op.iLike]: `%${category}%` };
    }

    // Filter by brand
    if (brand) {
      whereClause.brand = { [Op.iLike]: `%${brand}%` };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
    }

    // Stock filter
    if (inStock === 'true') {
      whereClause.stockQuantity = { [Op.gt]: 0 };
    } else if (inStock === 'false') {
      whereClause.stockQuantity = { [Op.eq]: 0 };
    } else if (inStock === 'low') {
      whereClause.stockQuantity = { [Op.and]: [{ [Op.lte]: 5 }, { [Op.gt]: 0 }] };
    } else if (inStock === 'medium') {
      whereClause.stockQuantity = { [Op.and]: [{ [Op.gte]: 6 }, { [Op.lte]: 20 }] };
    } else if (inStock === 'high') {
      whereClause.stockQuantity = { [Op.gt]: 20 };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    res.json({
      message: 'Products retrieved successfully',
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        totalProducts: count,
        hasNext: offset + products.length < count,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Failed to retrieve products',
      message: 'Internal server error'
    });
  }
};

/**
 * Get product by ID with sales history
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Order,
              as: 'order',
              attributes: ['id', 'orderDate', 'status'],
              where: { status: { [Op.ne]: 'cancelled' } },
              required: false
            }
          ],
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${id} does not exist`
      });
    }

    // Calculate product statistics
    const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = product.orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    const averageOrderQuantity = product.orderItems.length > 0 ? totalSold / product.orderItems.length : 0;

    // // Find the most recent order date for this product
    // const lastSoldDate = product.orderItems.length > 0
    //   ? product.orderItems.reduce((latest, item) => {
    //       const itemDate = new Date(item.order.orderDate);
    //       return itemDate > latest ? itemDate : latest;
    //     }, new Date(0))
    //   : null;
    // Find the most recent order date for this product
const lastSoldDate = product.orderItems.length > 0
  ? product.orderItems.reduce((latest, item) => {
      if (!item.order || !item.order.orderDate) return latest;
      const itemDate = new Date(item.order.orderDate);
      return itemDate > latest ? itemDate : latest;
    }, null)
  : null;


    res.json({
      message: 'Product retrieved successfully',
      product,
      statistics: {
        totalSold,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averageOrderQuantity: parseFloat(averageOrderQuantity.toFixed(2)),
        lastSoldDate,
        orderItems: product.orderItems, // Include order items for the sales history tab
        stockStatus: product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock',
        stockLevel: product.stockQuantity <= 5 ? 'Low' : product.stockQuantity <= 20 ? 'Medium' : 'High'
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Failed to retrieve product',
      message: 'Internal server error'
    });
  }
};

/**
 * Create new product
 */
const createProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there's an uploaded file and validation fails, delete it
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { name, description, price, stockQuantity, category, brand, color, material } = req.body;

    // Check if product with same name already exists
    const existingProduct = await Product.findOne({ where: { name } });
    if (existingProduct) {
      // If there's an uploaded file and product exists, delete it
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(409).json({
        error: 'Product already exists',
        message: 'A product with this name already exists'
      });
    }

    // Prepare product data
    const productData = {
      name,
      description,
      price,
      stockQuantity,
      category,
      brand,
      color,
      material
    };

    // Add image path if file was uploaded
    if (req.file) {
      productData.imagePath = req.file.filename; // Store relative path
    }

    const product = await Product.create(productData);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);

    // If there's an uploaded file and creation fails, delete it
    if (req.file) {
      deleteFile(req.file.path);
    }

    res.status(500).json({
      error: 'Failed to create product',
      message: 'Internal server error'
    });
  }
};

/**
 * Update product
 */
const updateProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there's an uploaded file and validation fails, delete it
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { name, description, price, stockQuantity, category, brand, color, material } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      // If there's an uploaded file and product not found, delete it
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${id} does not exist`
      });
    }

    // Check if name is being changed and if it's already taken
    if (name && name !== product.name) {
      const existingProduct = await Product.findOne({
        where: {
          id: { [Op.ne]: id },
          name
        }
      });

      if (existingProduct) {
        // If there's an uploaded file and name conflict, delete it
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.status(409).json({
          error: 'Update failed',
          message: 'Product name is already in use'
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price || product.price,
      category: category || product.category,
      brand: brand !== undefined ? brand : product.brand,
      color: color !== undefined ? color : product.color,
      material: material !== undefined ? material : product.material
    };

    // Only include stockQuantity in updateData if it was provided in the request
    if (stockQuantity !== undefined) {
      updateData.stockQuantity = stockQuantity;
    }

    // Handle image update
    if (req.file) {
      // Delete old image if it exists
      if (product.imagePath) {
        const oldImagePath = getFullPath(product.imagePath);
        deleteFile(oldImagePath);
      }
      // Set new image path
      updateData.imagePath = req.file.filename;
    }

    const oldStockQuantity = product.stockQuantity;
    await product.update(updateData);

    // Trigger inventory notifications ONLY if stock quantity was explicitly provided AND changed
    if (stockQuantity !== undefined && parseInt(stockQuantity) !== oldStockQuantity) {
      try {
        // Use the smart stock notification trigger that determines the appropriate notification type
        await notificationTriggers.onStockLevelChange(product, req.user.id);
        console.log(`📦 Stock notifications triggered for ${product.name}: ${oldStockQuantity} → ${product.stockQuantity}`);
      } catch (notificationError) {
        console.error('Error sending inventory notifications:', notificationError);
        // Don't fail the product update if notifications fail
      }
    } else {
      // Log when stock notifications are skipped
      if (stockQuantity === undefined) {
        console.log(`📦 Stock notifications skipped for ${product.name}: stockQuantity not provided in update`);
      } else if (parseInt(stockQuantity) === oldStockQuantity) {
        console.log(`📦 Stock notifications skipped for ${product.name}: stockQuantity unchanged (${oldStockQuantity})`);
      }
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);

    // If there's an uploaded file and update fails, delete it
    if (req.file) {
      deleteFile(req.file.path);
    }

    res.status(500).json({
      error: 'Failed to update product',
      message: 'Internal server error'
    });
  }
};

/**
 * Delete product (Admin only)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [{ model: OrderItem, as: 'orderItems' }]
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${id} does not exist`
      });
    }

    // Check if product has been ordered
    if (product.orderItems && product.orderItems.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete product',
        message: 'Product has existing orders and cannot be deleted. Consider setting stock to 0 instead.'
      });
    }

    // Delete associated image file if it exists
    if (product.imagePath) {
      const imagePath = getFullPath(product.imagePath);
      deleteFile(imagePath);
    }

    await product.destroy();

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      error: 'Failed to delete product',
      message: 'Internal server error'
    });
  }
};

/**
 * Update product stock (Admin only)
 */
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'set', reason } = req.body;

    if (quantity === undefined || quantity === null || quantity < 0) {
      return res.status(400).json({
        error: 'Invalid quantity',
        message: 'Quantity must be a non-negative number'
      });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${id} does not exist`
      });
    }

    // Store the previous stock before updating
    const previousStock = product.stockQuantity;

    let newStock;
    switch (operation) {
      case 'add':
        newStock = previousStock + parseInt(quantity);
        break;
      case 'subtract':
        newStock = previousStock - parseInt(quantity);
        if (newStock < 0) {
          return res.status(400).json({
            error: 'Insufficient stock',
            message: `Cannot subtract ${quantity} from current stock of ${previousStock}`
          });
        }
        break;
      case 'set':
      default:
        newStock = parseInt(quantity);
        break;
    }



    await product.update({ stockQuantity: newStock });

    // Trigger inventory notifications after stock adjustment
    try {
      // Use the smart stock notification trigger that determines the appropriate notification type
      await notificationTriggers.onStockLevelChange(product, req.user.id);
      console.log(`📦 Stock adjustment notifications triggered for ${product.name}: ${previousStock} → ${newStock} (${operation})`);

      // If stock was added significantly, check for restock recommendation
      if (operation === 'add' && parseInt(quantity) >= 10) {
        const salesData = {
          averageSales: 5, // This could be calculated from actual sales data
          daysUntilEmpty: Math.floor(newStock / 5),
          recommendedQuantity: Math.max(20, newStock * 1.5)
        };
        await notificationTriggers.onRestockRecommendation(product, salesData, req.user.id);
      }
    } catch (notificationError) {
      console.error('Error sending inventory notifications:', notificationError);
      // Don't fail the stock update if notifications fail
    }

    res.json({
      message: 'Stock updated successfully',
      product,
      stockChange: {
        previousStock,
        newStock,
        operation,
        quantity: parseInt(quantity),
        reason: reason || 'Manual adjustment'
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      error: 'Failed to update stock',
      message: 'Internal server error'
    });
  }
};

/**
 * Get low stock products
 */
const getLowStockProducts = async (req, res) => {
  try {
    const { threshold = 5 } = req.query;

    const products = await Product.findAll({
      where: {
        stockQuantity: { [Op.lte]: parseInt(threshold) }
      },
      order: [['stockQuantity', 'ASC']]
    });

    res.json({
      message: 'Low stock products retrieved successfully',
      products,
      threshold: parseInt(threshold),
      count: products.length
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      error: 'Failed to retrieve low stock products',
      message: 'Internal server error'
    });
  }
};

/**
 * Get product categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Product.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'productCount']
      ],
      group: ['category'],
      order: [['category', 'ASC']]
    });

    res.json({
      message: 'Categories retrieved successfully',
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to retrieve categories',
      message: 'Internal server error'
    });
  }
};

/**
 * Create a new category
 */
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Category name is required'
      });
    }

    const categoryName = name.trim();

    // Check if category already exists
    const existingCategory = await Product.findOne({
      where: { category: categoryName }
    });

    if (existingCategory) {
      return res.status(409).json({
        error: 'Category already exists',
        message: 'A category with this name already exists'
      });
    }

    // Create a placeholder product to establish the category
    // This is a temporary solution until we have a dedicated categories table
    const placeholderProduct = await Product.create({
      name: `__CATEGORY_PLACEHOLDER_${categoryName}_${Date.now()}`,
      description: `Placeholder product for category: ${categoryName}`,
      price: 0.01,
      stockQuantity: 0,
      category: categoryName,
      brand: '__PLACEHOLDER__',
      color: '__PLACEHOLDER__',
      material: '__PLACEHOLDER__'
    });

    // Immediately delete the placeholder product
    await placeholderProduct.destroy();

    res.status(201).json({
      message: 'Category created successfully',
      category: {
        category: categoryName,
        productCount: 0
      }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      error: 'Failed to create category',
      message: 'Internal server error'
    });
  }
};

/**
 * Get product statistics
 */
const getProductStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause = {};
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const [
      totalProducts,
      lowStockCount,
      outOfStockCount,
      productsByCategory,
      topSellingProducts
    ] = await Promise.all([
      // Total products count
      Product.count({ where: whereClause }),

      // Low stock products (stockQuantity <= 5)
      Product.count({
        where: {
          ...whereClause,
          stockQuantity: { [Op.lte]: 5, [Op.gt]: 0 }
        }
      }),

      // Out of stock products
      Product.count({
        where: {
          ...whereClause,
          stockQuantity: { [Op.lte]: 0 }
        }
      }),

      // Products by category
      Product.findAll({
        where: whereClause,
        attributes: [
          'category',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('price')), 'avgPrice']
        ],
        group: ['category'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
      }),

      // Top selling products (from order items)
      Product.findAll({
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
            include: [
              {
                model: Order,
                as: 'order',
                where: {
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
          'price',
          'stockQuantity',
          [sequelize.fn('SUM', sequelize.col('orderItems.quantity')), 'totalSold'],
          [sequelize.fn('SUM', sequelize.col('orderItems.totalPrice')), 'totalRevenue']
        ],
        group: ['Product.id', 'Product.name', 'Product.category', 'Product.price', 'Product.stockQuantity'],
        order: [[sequelize.fn('SUM', sequelize.col('orderItems.quantity')), 'DESC']],
        limit: 10,
        subQuery: false
      })
    ]);

    res.json({
      message: 'Product statistics retrieved successfully',
      statistics: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        productsByCategory: productsByCategory.map(cat => ({
          category: cat.category,
          count: parseInt(cat.dataValues.count),
          avgPrice: parseFloat((parseFloat(cat.dataValues.avgPrice) || 0).toFixed(2))
        })),
        topSellingProducts: topSellingProducts.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: parseFloat(product.price),
          stock: product.stockQuantity,
          totalSold: parseInt(product.dataValues.totalSold) || 0,
          totalRevenue: parseFloat((parseFloat(product.dataValues.totalRevenue) || 0).toFixed(2))
        }))
      }
    });
  } catch (error) {
    console.error('Get product statistics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve product statistics',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getCategories,
  createCategory,
  getProductStatistics
};
