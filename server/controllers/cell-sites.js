const db = require('../models');
const CellSite = db.CellSite;
const { Op } = require('sequelize');
const { 
  emitCellSiteUpdate, 
  emitCellSiteAlert, 
  emitCellSiteStatusChange 
} = require('../socket');

// Cache TTLs in seconds
const CACHE_TTL = {
  ALL_SITES: 3600, // 1 hour
  BOUNDS: 300,     // 5 minutes (more frequent updates)
  SINGLE_SITE: 1800, // 30 minutes
  INVENTORY: 1800,
  WORK_TASKS: 1800,
  SEARCH: 300      // 5 minutes for search results
};

const getCacheKey = (req) => {
  const base = `cell-sites:${req.originalUrl}`;
  // Include query/body params in cache key
  const params = req.method === 'GET' ? req.query : req.body;
  return Object.keys(params).length 
    ? `${base}:${JSON.stringify(params)}`
    : base;
};

// Advanced search for cell sites
exports.searchCellSites = async (req, res) => {
  try {
    const cacheKey = getCacheKey(req);
    const cached = await req.app.locals.redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const {
      name,
      technologies = [],
      statuses = [],
      minLat,
      maxLat,
      minLng,
      maxLng,
      alertSeverities = [],
      taskStatuses = [],
      page = 1,
      pageSize = 50
    } = req.body;

    const where = {};
    
    // Name search (case insensitive)
    if (name) {
      where.name = {
        [Op.iLike]: `%${name}%`
      };
    }

    // Technology filter
    if (technologies.length) {
      where.technologies = {
        [Op.overlap]: technologies
      };
    }

    // Status filter
    if (statuses.length) {
      where.status = {
        [Op.in]: statuses
      };
    }

    // Geographic bounds
    if (minLat && maxLat && minLng && maxLng) {
      where.latitude = {
        [Op.between]: [minLat, maxLat]
      };
      where.longitude = {
        [Op.between]: [minLng, maxLng]
      };
    }

    // Alert severity filter
    if (alertSeverities.length) {
      where.alerts = {
        [Op.overlap]: alertSeverities
      };
    }

    // Task status filter
    if (taskStatuses.length) {
      where.workTasks = {
        [Op.overlap]: taskStatuses
      };
    }

    // Start performance timer
    const startTime = process.hrtime();

    const { count, rows: cellSites } = await CellSite.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      benchmark: true
    });

    // Log query performance
    const diff = process.hrtime(startTime);
    const queryTime = diff[0] * 1e3 + diff[1] * 1e-6;
    console.log(`Search query executed in ${queryTime.toFixed(2)}ms`);

    const response = {
      data: cellSites,
      pagination: {
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil(count / pageSize)
      }
    };
    
    // Cache results
    await req.app.locals.redis.set(
      cacheKey,
      JSON.stringify(response),
      { EX: CACHE_TTL.SEARCH }
    );
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCellSites = async (req, res) => {
  try {
    const cacheKey = getCacheKey(req);
    const cached = await req.app.locals.redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    let where = {};
    
    // Filter by technology if specified
    if (req.query.technology) {
      where.technologies = {
        [Op.contains]: [req.query.technology]
      };
    }

    // Filter by alert status if specified
    if (req.query.hasAlerts === 'true') {
      where.alerts = {
        [Op.not]: []
      };
    }

    const cellSites = await CellSite.findAll({ where });
    
    // Ensure we always return an array, even if empty
    const response = Array.isArray(cellSites) ? cellSites : [];
    
    // Cache results
    await req.app.locals.redis.set(
      cacheKey,
      JSON.stringify(response),
      { EX: CACHE_TTL.ALL_SITES }
    );
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get cell sites within map bounds
exports.getCellSitesInBounds = async (req, res) => {
  try {
    const cacheKey = getCacheKey(req);
    const cached = await req.app.locals.redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const { minLat, maxLat, minLng, maxLng } = req.query;
    
    const cellSites = await CellSite.findAll({
      where: {
        latitude: {
          [Op.between]: [minLat, maxLat]
        },
        longitude: {
          [Op.between]: [minLng, maxLng]
        }
      }
    });
    
    // Cache results
    await req.app.locals.redis.set(
      cacheKey,
      JSON.stringify(cellSites),
      { EX: CACHE_TTL.BOUNDS }
    );
    
    res.json(cellSites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get inventory for a cell site
exports.getCellSiteInventory = async (req, res) => {
  try {
    const cellSite = await CellSite.findByPk(req.params.id);
    if (!cellSite) {
      return res.status(404).json({ message: 'Cell site not found' });
    }
    res.json(cellSite.inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get work tasks for a cell site
exports.getCellSiteWorkTasks = async (req, res) => {
  try {
    const cellSite = await CellSite.findByPk(req.params.id);
    if (!cellSite) {
      return res.status(404).json({ message: 'Cell site not found' });
    }
    res.json(cellSite.workTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCellSite = async (req, res) => {
  try {
    const cacheKey = getCacheKey(req);
    const cached = await req.app.locals.redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const cellSite = await CellSite.findByPk(req.params.id);
    if (!cellSite) {
      return res.status(404).json({ message: 'Cell site not found' });
    }
    
    // Cache result
    await req.app.locals.redis.set(
      cacheKey,
      JSON.stringify(cellSite),
      { EX: CACHE_TTL.SINGLE_SITE }
    );
    
    res.json(cellSite);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCellSite = async (req, res) => {
  try {
    const cellSite = await CellSite.create({
      ...req.body
    });
    
    // Invalidate relevant caches
    await req.app.locals.redis.del('cell-sites:/');
    await req.app.locals.redis.del('cell-sites:/bounds*');
    
    // Emit real-time update
    emitCellSiteUpdate(cellSite);
    
    res.status(201).json(cellSite);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateCellSite = async (req, res) => {
  try {
    // Get the cell site before update to check for status changes
    const oldCellSite = await CellSite.findByPk(req.params.id);
    if (!oldCellSite) {
      return res.status(404).json({ message: 'Cell site not found' });
    }
    
    const oldStatus = oldCellSite.status;
    
    const [updated] = await CellSite.update(req.body, {
      where: { id: req.params.id }
    });
    
    if (!updated) {
      return res.status(404).json({ message: 'Cell site not found' });
    }
    
    const updatedCellSite = await CellSite.findByPk(req.params.id);
    
    // Invalidate relevant caches
    await req.app.locals.redis.del(`cell-sites:/${req.params.id}`);
    await req.app.locals.redis.del(`cell-sites:/${req.params.id}/inventory`);
    await req.app.locals.redis.del(`cell-sites:/${req.params.id}/work-tasks`);
    await req.app.locals.redis.del('cell-sites:/');
    await req.app.locals.redis.del('cell-sites:/bounds*');
    
    // Emit real-time update
    emitCellSiteUpdate(updatedCellSite);
    
    // Check if status changed and emit status change event
    if (oldStatus !== updatedCellSite.status) {
      emitCellSiteStatusChange(updatedCellSite, oldStatus, updatedCellSite.status);
    }
    
    // Check if alerts were added and emit alert events
    if (req.body.alerts && Array.isArray(req.body.alerts)) {
      const oldAlerts = oldCellSite.alerts || [];
      const newAlerts = req.body.alerts;
      
      // Find alerts that were added
      const addedAlerts = newAlerts.filter(alert => !oldAlerts.includes(alert));
      
      // Emit alert events for new alerts
      addedAlerts.forEach(alert => {
        emitCellSiteAlert(updatedCellSite, alert);
      });
    }
    
    res.json(updatedCellSite);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCellSite = async (req, res) => {
  try {
    // Get the cell site before deletion
    const cellSite = await CellSite.findByPk(req.params.id);
    if (!cellSite) {
      return res.status(404).json({ message: 'Cell site not found' });
    }
    
    const deleted = await CellSite.destroy({
      where: { id: req.params.id }
    });
    
    if (!deleted) {
      return res.status(404).json({ message: 'Cell site not found' });
    }
    
    // Invalidate relevant caches
    await req.app.locals.redis.del(`cell-sites:/${req.params.id}`);
    await req.app.locals.redis.del(`cell-sites:/${req.params.id}/inventory`);
    await req.app.locals.redis.del(`cell-sites:/${req.params.id}/work-tasks`);
    await req.app.locals.redis.del('cell-sites:/');
    await req.app.locals.redis.del('cell-sites:/bounds*');
    
    // Emit status change event (to deleted)
    emitCellSiteStatusChange(cellSite, cellSite.status, 'deleted');
    
    res.json({ message: 'Cell site deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
