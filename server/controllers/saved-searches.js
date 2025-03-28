const db = require('../models');
const SavedSearch = db.SavedSearch;
const { Op } = require('sequelize');
const { emitSavedSearchUpdate } = require('../socket');

// Cache TTLs in seconds
const CACHE_TTL = {
  ALL_SAVED_SEARCHES: 1800, // 30 minutes
  SINGLE_SAVED_SEARCH: 1800 // 30 minutes
};

const getCacheKey = (req) => {
  const base = `saved-searches:${req.originalUrl}`;
  // Include query/body params in cache key
  const params = req.method === 'GET' ? req.query : req.body;
  return Object.keys(params).length 
    ? `${base}:${JSON.stringify(params)}`
    : base;
};

// Get all saved searches
exports.getSavedSearches = async (req, res) => {
  try {
    const cacheKey = getCacheKey(req);
    const cached = await req.app.locals.redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    console.log('Fetching saved searches from database...');
    const savedSearches = await SavedSearch.findAll();
    console.log('Saved searches from database:', savedSearches);
    
    // Cache results
    await req.app.locals.redis.set(
      cacheKey,
      JSON.stringify(savedSearches),
      { EX: CACHE_TTL.ALL_SAVED_SEARCHES }
    );
    
    res.json(savedSearches);
  } catch (err) {
    console.error('Error fetching saved searches:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get a single saved search by ID
exports.getSavedSearch = async (req, res) => {
  try {
    const cacheKey = getCacheKey(req);
    const cached = await req.app.locals.redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const savedSearch = await SavedSearch.findByPk(req.params.id);
    
    if (!savedSearch) {
      return res.status(404).json({ message: 'Saved search not found' });
    }
    
    // Cache result
    await req.app.locals.redis.set(
      cacheKey,
      JSON.stringify(savedSearch),
      { EX: CACHE_TTL.SINGLE_SAVED_SEARCH }
    );
    
    res.json(savedSearch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new saved search
exports.createSavedSearch = async (req, res) => {
  try {
    const { name, description, criteria } = req.body;
    
    if (!name || !criteria) {
      return res.status(400).json({ message: 'Name and criteria are required' });
    }
    
    const savedSearch = await SavedSearch.create({
      name,
      description,
      criteria
    });
    
    // Invalidate cache for all saved searches
    await req.app.locals.redis.del('saved-searches:/');
    
    // Emit real-time update
    emitSavedSearchUpdate(savedSearch);
    
    res.status(201).json(savedSearch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a saved search
exports.updateSavedSearch = async (req, res) => {
  try {
    const { name, description, criteria } = req.body;
    
    const [updated] = await SavedSearch.update(
      { name, description, criteria },
      { where: { id: req.params.id } }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Saved search not found' });
    }
    
    const updatedSavedSearch = await SavedSearch.findByPk(req.params.id);
    
    // Invalidate caches
    await req.app.locals.redis.del(`saved-searches:/${req.params.id}`);
    await req.app.locals.redis.del('saved-searches:/');
    
    // Emit real-time update
    emitSavedSearchUpdate(updatedSavedSearch);
    
    res.json(updatedSavedSearch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a saved search
exports.deleteSavedSearch = async (req, res) => {
  try {
    // Get the saved search before deletion
    const savedSearch = await SavedSearch.findByPk(req.params.id);
    if (!savedSearch) {
      return res.status(404).json({ message: 'Saved search not found' });
    }
    
    const deleted = await SavedSearch.destroy({
      where: { id: req.params.id }
    });
    
    if (!deleted) {
      return res.status(404).json({ message: 'Saved search not found' });
    }
    
    // Invalidate caches
    await req.app.locals.redis.del(`saved-searches:/${req.params.id}`);
    await req.app.locals.redis.del('saved-searches:/');
    
    // Emit real-time update with deletion flag
    savedSearch.dataValues.deleted = true;
    emitSavedSearchUpdate(savedSearch);
    
    res.json({ message: 'Saved search deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
