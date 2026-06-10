const pool = require('../config/db');
const xlsx = require('xlsx');

//GET /api/schedules - Get all schedules
const getAllSchedules = async (req, res) => {
    try {
        const query = `
        SELECT *
        FROM schedules
        ORDER BY date ASC, jam_ke ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json({
            status: 'Success',
            message: 'Schedules retrieved successfully',
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
}

//POST /api/schedules - Create new schedule
const createSchedule = async (req, res) => {
    try {
        const {
            class_code, class_name, subject_code,
            teacher_nik, teacher_name, date,
            jam_ke, time_start, time_end
        } = req.body;

        if (!class_code || !class_name || !subject_code || !teacher_nik || !teacher_name || !date || !jam_ke || !time_start || !time_end) {
            return res.status(400).json({
                status: 'Bad Request',
                message: 'Missing required fields'
            });
        }

        // Check for conflicts
        const checkQuery = `
            SELECT id, class_code, teacher_nik 
            FROM schedules 
            WHERE date = $1 AND jam_ke = $2 AND (class_code = $3 OR teacher_nik = $4)
            LIMIT 1;
        `;
        const checkValues = [date, jam_ke, class_code, teacher_nik];
        const conflictCheck = await pool.query(checkQuery, checkValues);

        if (conflictCheck.rows.length > 0) {
            const conflict = conflictCheck.rows[0];
            const reason = conflict.class_code === class_code 
                ? `Kelas ${class_code} sudah memiliki jadwal di jam tersebut`
                : `Guru dengan NIK ${teacher_nik} sudah memiliki jadwal di jam tersebut`;
                
            return res.status(409).json({
                status: 'Conflict',
                message: `Bentrok jadwal: ${reason}`
            });
        }

        const query = `
        INSERT INTO schedules (class_code, class_name, subject_code, teacher_nik, teacher_name, date, jam_ke, time_start, time_end)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
        `;

        const values = [
            class_code, class_name, subject_code,
            teacher_nik, teacher_name, date,
            jam_ke, time_start, time_end
        ];

        const result = await pool.query(query, values);
        res.status(201).json({
            status: 'Success',
            message: 'Schedule created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
}

//PUT /api/schedules/:id - update schedules
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            class_code, class_name, subject_code,
            teacher_nik, teacher_name, date,
            jam_ke, time_start, time_end
        } = req.body;

        if (!class_code || !class_name || !subject_code || !teacher_nik || !teacher_name || !date || !jam_ke || !time_start || !time_end) {
            return res.status(400).json({
                status: 'Bad Request',
                message: 'Missing required fields'
            });
        }

        // Check for conflicts
        const checkQuery = `
            SELECT id, class_code, teacher_nik 
            FROM schedules 
            WHERE date = $1 AND jam_ke = $2 AND (class_code = $3 OR teacher_nik = $4) AND id != $5
            LIMIT 1;
        `;
        const checkValues = [date, jam_ke, class_code, teacher_nik, id];
        const conflictCheck = await pool.query(checkQuery, checkValues);

        if (conflictCheck.rows.length > 0) {
            const conflict = conflictCheck.rows[0];
            const reason = conflict.class_code === class_code 
                ? `Kelas ${class_code} sudah memiliki jadwal di jam tersebut`
                : `Guru dengan NIK ${teacher_nik} sudah memiliki jadwal di jam tersebut`;
                
            return res.status(409).json({
                status: 'Conflict',
                message: `Bentrok jadwal: ${reason}`
            });
        }

        const query = `
        UPDATE schedules
        SET class_code = $1, class_name = $2, subject_code = $3,
            teacher_nik = $4, teacher_name = $5, date = $6,
            jam_ke = $7, time_start = $8, time_end = $9
        WHERE id = $10
        RETURNING *;
        `;

        const values = [
            class_code, class_name, subject_code,
            teacher_nik, teacher_name, date,
            jam_ke, time_start, time_end, id
        ];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 'Not Found',
                message: 'Schedule not found'
            });
        }
        res.status(200).json({
            status: 'Success',
            message: 'Schedule updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
}

//DELETE /api/schedules/:id - delete schedules
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
        DELETE FROM schedules
        WHERE id = $1
        RETURNING *;
        `;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 'Not Found',
                message: 'Schedule not found'
            });
        }

        res.status(200).json({
            status: 'Success',
            message: 'Schedule deleted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
}

//Get by class code 
const getSchedulesByClassCode = async (req, res) => {
    try {
        const { class_code } = req.params;
        const query = `
        SELECT *
        FROM schedules
        WHERE class_code = $1
        ORDER BY date ASC, jam_ke ASC;
        `;
        const result = await pool.query(query, [class_code]);
        res.status(200).json({
            status: 'Success',
            message: 'Schedules retrieved successfully',
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
}

// Student: Get schedule by class code and date 
const getStudentSchedule = async (req, res) => {
    try {
        const { class_code, date } = req.query;
        if (!class_code || !date) return res.status(400).json({
            status: 'Bad Request',
            message: 'Missing required fields'
        });

        const query = `SELECT * FROM schedules WHERE class_code = $1 AND date = $2 ORDER BY jam_ke ASC;`;
        const result = await pool.query(query, [class_code, date]);

        const className = result.rows.length > 0 ? result.rows[0].class_name : "";
        const jadwalMapped = result.rows.map(row => ({
            "jam_ke": row.jam_ke,
            "subject_code": row.subject_code,
            "teacher_name": row.teacher_name,
            "time_start": row.time_start,
            "time_end": row.time_end
        }));

        return res.status(200).json({
            "classname": className,
            "date": date,
            "Jadwal": jadwalMapped
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

//Teacher: Get schedule by teacher NIK and date range
const getTeacherSchedule = async (req, res) => {
    try {
        const { teacher_nik, start_date, end_date } = req.query;
        if (!teacher_nik || !start_date || !end_date) return res.status(400).json({ error: 'teacher_nik, start_date, dan end_date wajib diisi' });

        const query = `SELECT * FROM schedules WHERE teacher_nik = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC, jam_ke ASC;`;
        const result = await pool.query(query, [teacher_nik, start_date, end_date]);

        const teacherName = result.rows.length > 0 ? result.rows[0].teacher_name : "";
        const totalJp = result.rows.length;

        const jadwalMapped = result.rows.map(row => ({
            "date": row.date.toISOString().split('T')[0],
            "class_name": row.class_name,
            "subject_code": row.subject_code,
            "jam_ke": row.jam_ke,
            "time_start": row.time_start,
            "time_end": row.time_end
        }));

        return res.status(200).json({
            "teacher_name": teacherName,
            "periode": { "start date": start_date, "end_date": end_date },
            "total jp": totalJp,
            "jadwal": jadwalMapped
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

//Yayasan: Get schedule by date range
const getYayasanReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        if (!start_date || !end_date) return res.status(400).json({ error: 'start_date dan end_date wajib diisi' });

        const query = `SELECT * FROM schedules WHERE date BETWEEN $1 AND $2;`;
        const result = await pool.query(query, [start_date, end_date]);

        const rekapMap = {};
        result.rows.forEach(row => {
            const nik = row.teacher_nik;
            if (!rekapMap[nik]) {
                rekapMap[nik] = {
                    "teacher nik": nik,
                    "teacher_name": row.teacher_name,
                    "total jp": 0,
                    "classes": new Set(),
                    "classDetails": {}
                };
            }
            rekapMap[nik]["total jp"] += 1;
            rekapMap[nik]["classes"].add(row.class_name);
            rekapMap[nik]["classDetails"][row.class_name] = (rekapMap[nik]["classDetails"][row.class_name] || 0) + 1;
        });

        const rekapArray = Object.values(rekapMap).map(t => ({
            "teacher nik": t["teacher nik"], 
            "teacher_name": t.teacher_name,
            "total jp": t["total jp"], 
            "total_kelas": t.classes.size,
            "detail": Object.keys(t.classDetails).map(cName => ({
                "class_name": cName,
                "jumlah jp": t.classDetails[cName],
            }))
        }));

        return res.status(200).json({
            "periode": { "start date": start_date, "end date": end_date },
            "total pengajar": rekapArray.length,
            "rekap": rekapArray
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

//upload excel 
const uploadExcel = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'File Excel wajib diupload' });

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        let successCount = 0;
        let failedRows = [];
        
        for (let i = 0; i < sheetData.length; i++) {
            const row = sheetData[i];
            let dateVal = row.date;
            // Jika date terbaca sebagai serial number Excel
            if (typeof dateVal === 'number') {
                // Konversi serial number ke YYYY-MM-DD
                dateVal = new Date((dateVal - 25569) * 86400 * 1000).toISOString().split('T')[0];
            }

            // Pengecekan bentrok jadwal
            const checkQuery = `
                SELECT id, class_code, teacher_nik 
                FROM schedules 
                WHERE date = $1 AND jam_ke = $2 AND (class_code = $3 OR teacher_nik = $4)
                LIMIT 1;
            `;
            const checkValues = [dateVal, row.jam_ke, row.class_code, row.teacher_nik];
            const conflictCheck = await pool.query(checkQuery, checkValues);

            if (conflictCheck.rows.length > 0) {
                const conflict = conflictCheck.rows[0];
                const reason = conflict.class_code === row.class_code 
                    ? `Kelas ${row.class_code} bentrok`
                    : `Guru ${row.teacher_nik} bentrok`;
                failedRows.push({ row: i + 2, data: row, reason: reason }); // +2 karena baris 1 adalah header Excel
                continue; // Skip baris ini
            }

            const query = `
                INSERT INTO schedules (class_code, class_name, subject_code, teacher_nik, teacher_name, date, jam_ke, time_start, time_end)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
            `;
            const values = [
                row.class_code, row.class_name, row.subject_code,
                row.teacher_nik, row.teacher_name, dateVal,
                row.jam_ke, row.time_start, row.time_end
            ];
            await pool.query(query, values);
            successCount++;
        }

        res.status(200).json({ 
            message: `Upload selesai. ${successCount} baris berhasil, ${failedRows.length} baris gagal.`,
            success_count: successCount,
            failed_count: failedRows.length,
            failed_rows: failedRows
        }); 
    } catch (error) {
        res.status(500).json({ 
            status: 'Error',
            message: error.message 
        });
    }
};

//export excel
const exportExcel = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        // Mengambil rekap mingguan/bulanan dari DB
        const query = `
            SELECT teacher_nik, teacher_name, 
                   string_agg(DISTINCT class_name, ', ') as kelas,
                   count(id) as total_jp
            FROM schedules 
            WHERE date BETWEEN $1 AND $2
            GROUP BY teacher_nik, teacher_name;
        `;
        const result = await pool.query(query, [start_date, end_date]);

        const dataExcel = result.rows.map((row, index) => ({
            "No": index + 1, 
            "NIK": row.teacher_nik, 
            "Nama Pengajar": row.teacher_name, 
            "Kelas yg Diajar": row.kelas, 
            "Total JP": row.total_jp 
        }));

        const worksheet = xlsx.utils.json_to_sheet(dataExcel);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Rekap JP");

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Set header agar browser mengunduh langsung filenya
        res.setHeader('Content-Disposition', 'attachment; filename="rekap_jp.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

module.exports = {
    getAllSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedulesByClassCode,
    getStudentSchedule,
    getTeacherSchedule,
    getYayasanReport,
    uploadExcel,
    exportExcel
}