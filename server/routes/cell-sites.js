const express = require('express');
const router = express.Router();
const cellSitesController = require('../controllers/cell-sites');
const { cacheMiddleware, setCache } = require('../middleware/cache');

// GET all cell sites
router.get('/', cacheMiddleware, (req, res, next) => {
  const originalSend = res.send;
  res.send = (data) => {
    setCache(req, data);
    originalSend.call(res, data);
  };
  next();
}, cellSitesController.getCellSites);

// GET cell sites within map bounds
router.get('/bounds', cacheMiddleware, (req, res, next) => {
  const originalSend = res.send;
  res.send = (data) => {
    setCache(req, data);
    originalSend.call(res, data);
  };
  next();
}, cellSitesController.getCellSitesInBounds);

// GET single cell site
router.get('/:id', cacheMiddleware, (req, res, next) => {
  const originalSend = res.send;
  res.send = (data) => {
    setCache(req, data);
    originalSend.call(res, data);
  };
  next();
}, cellSitesController.getCellSite);

// GET cell site inventory
router.get('/:id/inventory', cacheMiddleware, (req, res, next) => {
  const originalSend = res.send;
  res.send = (data) => {
    setCache(req, data);
    originalSend.call(res, data);
  };
  next();
}, cellSitesController.getCellSiteInventory);

// GET cell site work tasks
router.get('/:id/work-tasks', cacheMiddleware, (req, res, next) => {
  const originalSend = res.send;
  res.send = (data) => {
    setCache(req, data);
    originalSend.call(res, data);
  };
  next();
}, cellSitesController.getCellSiteWorkTasks);

// POST search cell sites
router.post('/search', cacheMiddleware, (req, res, next) => {
  const originalSend = res.send;
  res.send = (data) => {
    setCache(req, data);
    originalSend.call(res, data);
  };
  next();
}, cellSitesController.searchCellSites);

// POST new cell site
router.post('/', cellSitesController.createCellSite);

// PUT update cell site
router.put('/:id', cellSitesController.updateCellSite);

// DELETE cell site
router.delete('/:id', cellSitesController.deleteCellSite);

module.exports = router;
