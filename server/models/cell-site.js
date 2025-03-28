'use strict';

module.exports = (sequelize, DataTypes) => {
  const CellSite = sequelize.define('CellSite', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false
    },
    technologies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    inventory: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    alerts: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    workTasks: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['latitude', 'longitude']
      }
    ]
  });

  return CellSite;
};
