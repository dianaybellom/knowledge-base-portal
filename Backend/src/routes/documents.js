const { Router } = require('express');
const documentsController = require('../controllers/documentsController');
const { requireRole } = require('../middleware/auth');

// Se monta en /api/solutions/:code/documents (la autenticación la aplica el router padre).
const router = Router({ mergeParams: true });
const canEdit = requireRole('author', 'admin');

router.get('/:type', documentsController.getByType);
router.put('/:type', canEdit, documentsController.upsert);
router.delete('/:type', canEdit, documentsController.remove);

module.exports = router;
