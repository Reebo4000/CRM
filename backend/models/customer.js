'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Customer has many Orders
      Customer.hasMany(models.Order, {
        foreignKey: 'customerId',
        as: 'orders'
      });
    }

    // Instance method to get full name
    getFullName() {
      return `${this.firstName} ${this.lastName}`;
    }

    // Instance method to get customer age
    getAge() {
      if (!this.dateOfBirth) return null;
      const today = new Date();
      const birthDate = new Date(this.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
  }

  Customer.init({
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 20]
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [2, 50]
      }
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [3, 10]
      }
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString()
      }
    }
  }, {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers'
  });

  return Customer;
};