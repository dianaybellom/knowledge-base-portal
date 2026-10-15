const { Router } = require('express');
const solutionsController = require('../controllers/solutionsController');
const componentsController = require('../controllers/componentsController');
const documentsRoutes = require('./documents');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadSingleFile } = require('../middleware/upload');

const router = Router();
const canEdit = requireRole('author', 'admin');

router.use(requireAuth);

router.get('/', solutionsController.list);
router.get('/coverage', solutionsController.coverage);
router.get('/recent-updates', solutionsController.recentUpdates);
router.get('/:code', solutionsController.getByCode);
router.post('/', canEdit, solutionsController.create);
router.put('/:code', canEdit, solutionsController.update);
router.delete('/:code', canEdit, solutionsController.remove);

// El archivo se procesa después de verificar el rol, para no recibir subidas no autorizadas.
router.post('/:code/components', canEdit, uploadSingleFile, componentsController.create);

router.use('/:code/documents', documentsRoutes);

module.exports = router;
