const { Router } = require('express');
const componentsController = require('../controllers/componentsController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/:id/download', componentsController.download);
router.delete('/:id', requireRole('author', 'admin'), componentsController.remove);

module.exports = router;
