const express = require('express');
const multer = require('multer');
const router = express.Router();
const verifyApiKey = require('../middleware/auth');
const {
    validate,
    scheduleBodyRules,
    schedulePatchRules,
    dateRangeRules,
    studentQueryRules,
    teacherQueryRules,
} = require('../middleware/validators');
const {
    createSchedule,
    getAllSchedules,
    updateSchedule,
    deleteSchedule,
    getStudentSchedule,
    getTeacherSchedule,
    getYayasanReport,
    uploadExcel,
    exportExcel,
    getLaporanHarian,
    getLaporanBulanan
} = require('../controllers/scheduleController');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        const isExcel = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ].includes(file.mimetype);
        if (!isExcel) {
            return cb(new Error('Hanya file Excel (.xlsx / .xls) yang diperbolehkan'));
        }
        cb(null, true);
    }
});

router.get('/export', exportExcel);

router.use(verifyApiKey);

router.get('/', getAllSchedules);
router.post('/', scheduleBodyRules, validate, createSchedule);
router.put('/:id', scheduleBodyRules, validate, updateSchedule);
router.patch('/:id', schedulePatchRules, validate, updateSchedule);
router.delete('/:id', deleteSchedule);
router.get('/students', studentQueryRules, validate, getStudentSchedule);
router.get('/teacher', teacherQueryRules, validate, getTeacherSchedule);
router.get('/report/rekap-jp', dateRangeRules, validate, getYayasanReport);
router.get('/report/harian', getLaporanHarian);
router.get('/report/bulanan', getLaporanBulanan);
router.post('/upload', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    status: 'Bad Request',
                    message: `Ukuran file melebihi batas maksimum ${MAX_FILE_SIZE / (1024 * 1024)} MB`
                });
            }
            return res.status(400).json({
                status: 'Bad Request',
                message: err.message
            });
        }
        next();
    });
}, uploadExcel);

module.exports = router;
