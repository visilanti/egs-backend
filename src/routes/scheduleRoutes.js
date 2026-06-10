const express = require('express');
const multer = require('multer');
const router = express.Router();
const verifyApiKey = require('../middleware/auth');
const {
    createSchedule, 
    getAllSchedules, 
    updateSchedule, 
    deleteSchedule,
    getStudentSchedule, 
    getTeacherSchedule, 
    getYayasanReport,
    uploadExcel, 
    exportExcel
} = require('../controllers/scheduleController');

const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyApiKey);

router.get('/', getAllSchedules);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);
router.get('/students', getStudentSchedule);
router.get('/teacher', getTeacherSchedule);
router.get('/report/rekap-jp', getYayasanReport);

router.post('/upload', upload.single('file'), uploadExcel);
router.get('/export', exportExcel);

module.exports = router;
