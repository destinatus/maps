const express = require('express');
const router = express.Router();
const savedSearchesController = require('../controllers/saved-searches');
const { cacheMiddleware, setCache } = require('../middleware/cache');

// GET all saved searches
router.get('/', cacheMiddleware, (req, res, next) => {
  const originalSend = res.send;
  res.send = (data) => {
    setCache(req, data);
    originalSend.call(res, data);
  };
  next();
}, savedSearchesController.getSavedSearches);

// GET single saved search
router.get('/:id', cacheMiddleware, (req, res, next) => {
  const originalSend = res.send;
  res.send = (data) => {
    setCache(req, data);
    originalSend.call(res, data);
  };
  next();
}, savedSearchesController.getSavedSearch);

// POST new saved search
router.post('/', savedSearchesController.createSavedSearch);

// PUT update saved search
router.put('/:id', savedSearchesController.updateSavedSearch);

// DELETE saved search
router.delete('/:id', savedSearchesController.deleteSavedSearch);

module.exports = router;
