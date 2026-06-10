const { body, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'Bad Request',
            message: 'Validasi gagal',
            errors: errors.array().map(e => ({
                field: e.path,
                message: e.msg
            }))
        });
    }
    next();
};

const scheduleBodyRules = [
    body('class_code')
        .trim().notEmpty().withMessage('class_code wajib diisi')
        .isLength({ max: 20 }).withMessage('class_code maksimal 20 karakter'),

    body('class_name')
        .trim().notEmpty().withMessage('class_name wajib diisi')
        .isLength({ max: 50 }).withMessage('class_name maksimal 50 karakter'),

    body('subject_code')
        .trim().notEmpty().withMessage('subject_code wajib diisi')
        .isLength({ max: 20 }).withMessage('subject_code maksimal 20 karakter'),

    body('teacher_nik')
        .trim().notEmpty().withMessage('teacher_nik wajib diisi')
        .isLength({ max: 20 }).withMessage('teacher_nik maksimal 20 karakter'),

    body('teacher_name')
        .trim().notEmpty().withMessage('teacher_name wajib diisi')
        .isLength({ max: 100 }).withMessage('teacher_name maksimal 100 karakter'),

    body('date')
        .notEmpty().withMessage('date wajib diisi')
        .isDate({ format: 'YYYY-MM-DD', strictMode: true })
        .withMessage('date harus berformat YYYY-MM-DD (contoh: 2026-06-15)'),

    body('jam_ke')
        .notEmpty().withMessage('jam_ke wajib diisi')
        .isInt({ min: 1, max: 12 }).withMessage('jam_ke harus bilangan bulat antara 1 - 12'),

    body('time_start')
        .notEmpty().withMessage('time_start wajib diisi')
        .matches(/^\d{2}:\d{2}$/).withMessage('time_start harus berformat HH:MM (contoh: 07:00)'),

    body('time_end')
        .notEmpty().withMessage('time_end wajib diisi')
        .matches(/^\d{2}:\d{2}$/).withMessage('time_end harus berformat HH:MM (contoh: 07:45)')
        .custom((value, { req }) => {
            if (req.body.time_start && value <= req.body.time_start) {
                throw new Error('time_end harus lebih besar dari time_start');
            }
            return true;
        }),
];

const schedulePatchRules = [
    body('class_code').optional()
        .trim().notEmpty().withMessage('class_code tidak boleh string kosong')
        .isLength({ max: 20 }).withMessage('class_code maksimal 20 karakter'),

    body('class_name').optional()
        .trim().notEmpty().withMessage('class_name tidak boleh string kosong')
        .isLength({ max: 50 }).withMessage('class_name maksimal 50 karakter'),

    body('subject_code').optional()
        .trim().notEmpty().withMessage('subject_code tidak boleh string kosong')
        .isLength({ max: 20 }).withMessage('subject_code maksimal 20 karakter'),

    body('teacher_nik').optional()
        .trim().notEmpty().withMessage('teacher_nik tidak boleh string kosong')
        .isLength({ max: 20 }).withMessage('teacher_nik maksimal 20 karakter'),

    body('teacher_name').optional()
        .trim().notEmpty().withMessage('teacher_name tidak boleh string kosong')
        .isLength({ max: 100 }).withMessage('teacher_name maksimal 100 karakter'),

    body('date').optional()
        .isDate({ format: 'YYYY-MM-DD', strictMode: true })
        .withMessage('date harus berformat YYYY-MM-DD (contoh: 2026-06-15)'),

    body('jam_ke').optional()
        .isInt({ min: 1, max: 12 }).withMessage('jam_ke harus bilangan bulat antara 1 - 12'),

    body('time_start').optional()
        .matches(/^\d{2}:\d{2}$/).withMessage('time_start harus berformat HH:MM (contoh: 07:00)'),

    body('time_end').optional()
        .matches(/^\d{2}:\d{2}$/).withMessage('time_end harus berformat HH:MM (contoh: 07:45)'),
];

const dateRangeRules = [
    query('start_date')
        .notEmpty().withMessage('start_date wajib diisi')
        .isDate({ format: 'YYYY-MM-DD', strictMode: true })
        .withMessage('start_date harus berformat YYYY-MM-DD'),

    query('end_date')
        .notEmpty().withMessage('end_date wajib diisi')
        .isDate({ format: 'YYYY-MM-DD', strictMode: true })
        .withMessage('end_date harus berformat YYYY-MM-DD')
        .custom((value, { req }) => {
            if (req.query.start_date && value < req.query.start_date) {
                throw new Error('end_date tidak boleh lebih kecil dari start_date');
            }
            return true;
        }),
];

const studentQueryRules = [
    query('class_code')
        .trim().notEmpty().withMessage('class_code wajib diisi'),

    query('date')
        .notEmpty().withMessage('date wajib diisi')
        .isDate({ format: 'YYYY-MM-DD', strictMode: true })
        .withMessage('date harus berformat YYYY-MM-DD'),
];

const teacherQueryRules = [
    query('teacher_nik')
        .trim().notEmpty().withMessage('teacher_nik wajib diisi'),

    ...dateRangeRules,
];

module.exports = {
    validate,
    scheduleBodyRules,
    schedulePatchRules,
    dateRangeRules,
    studentQueryRules,
    teacherQueryRules,
};
