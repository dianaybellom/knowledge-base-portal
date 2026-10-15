const { Router } = require('express');
const usersController = require('../controllers/usersController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', usersController.list);
router.patch('/:id/role', usersController.updateRole);
router.delete('/:id', usersController.remove);

module.exports = router;
