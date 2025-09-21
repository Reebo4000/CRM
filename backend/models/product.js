'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Product has many OrderItems
      Product.hasMany(models.OrderItem, {
        foreignKey: 'productId',
        as: 'orderItems'
      });
    }

    // Instance method to check if product is in stock
    isInStock(quantity = 1) {
      return this.stockQuantity >= quantity;
    }

    // Instance method to update stock
    async updateStock(quantity, operation = 'subtract') {
      if (operation === 'subtract') {
        if (this.stockQuantity < quantity) {
          throw new Error('Insufficient stock');
        }
        this.stockQuantity -= quantity;
      } else if (operation === 'add') {
        this.stockQuantity += quantity;
      }
      await this.save();
      return this;
    }

    // Instance method to get formatted price
    getFormattedPrice() {
      return `$${parseFloat(this.price).toFixed(2)}`;
    }
  }

  Product.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Brand must not exceed 50 characters'
        }
      }
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 30],
          msg: 'Color must not exceed 30 characters'
        }
      }
    },
    material: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Material must not exceed 50 characters'
        }
      }
    },
    imagePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Image path must not exceed 500 characters'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products'
  });

  return Product;
};