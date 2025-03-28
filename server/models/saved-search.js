'use strict';

module.exports = (sequelize, DataTypes) => {
  const SavedSearch = sequelize.define('SavedSearch', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    criteria: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'JSON object containing search criteria'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['name']
      }
    ]
  });

  return SavedSearch;
};
