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
            status: 'Success',
            message: 'Student schedule retrieved successfully',
            data: {
                "class_name": className,
                "date": date,
                "jadwal": jadwalMapped
            }
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
        if (!teacher_nik || !start_date || !end_date) return res.status(400).json({
            status: 'Bad Request',
            message: 'teacher_nik, start_date, dan end_date wajib diisi'
        });

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
            status: 'Success',
            message: 'Teacher schedule retrieved successfully',
            data: {
                "teacher_name": teacherName,
                "periode": { "start_date": start_date, "end_date": end_date },
                "total_jp": totalJp,
                "jadwal": jadwalMapped
            }
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
        if (!start_date || !end_date) return res.status(400).json({
            status: 'Bad Request',
            message: 'start_date dan end_date wajib diisi'
        });

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
            status: 'Success',
            message: 'Yayasan report retrieved successfully',
            data: {
                "periode": { "start_date": start_date, "end_date": end_date },
                "total_pengajar": rekapArray.length,
                "rekap": rekapArray
            }
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
        if (!req.file) return res.status(400).json({
            status: 'Bad Request',
            message: 'File Excel wajib diupload'
        });

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
            status: 'Success',
            message: `Upload selesai. ${successCount} baris berhasil, ${failedRows.length} baris gagal.`,
            data: {
                success_count: successCount,
                failed_count: failedRows.length,
                failed_rows: failedRows
            }
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

    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
        return res.status(400).json({ message: 'start_date dan end_date wajib diisi.' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
        return res.status(400).json({ message: 'Format tanggal harus YYYY-MM-DD.' });
    }

    try {
        const result = await pool.query(`
        SELECT
            teacher_nik                                    AS nik,
            teacher_name                                   AS nama_pengajar,
            STRING_AGG(DISTINCT class_name, ', ')          AS kelas_diajar,

            -- SUM jam (bukan COUNT) per pekan
            COALESCE(SUM(CASE WHEN pekan_ke = 1 THEN jam_jp END), 0) AS pekan_1,
            COALESCE(SUM(CASE WHEN pekan_ke = 2 THEN jam_jp END), 0) AS pekan_2,
            COALESCE(SUM(CASE WHEN pekan_ke = 3 THEN jam_jp END), 0) AS pekan_3,
            COALESCE(SUM(CASE WHEN pekan_ke = 4 THEN jam_jp END), 0) AS pekan_4,
            COALESCE(SUM(CASE WHEN pekan_ke = 5 THEN jam_jp END), 0) AS pekan_5,
            SUM(jam_jp)                                    AS total_jp

        FROM (
            SELECT
            *,
            -- Hitung durasi jam: selisih time_end - time_start dalam jam
            EXTRACT(EPOCH FROM (time_end::time - time_start::time)) / 3600 AS jam_jp,

            -- Urutan pekan berdasarkan ISO week (Senin) dalam rentang tanggal
            DENSE_RANK() OVER (
                ORDER BY DATE_TRUNC('week', date::date)
            ) AS pekan_ke

            FROM schedules
            WHERE date::date BETWEEN $1::date AND $2::date
        ) sub

        GROUP BY teacher_nik, teacher_name
        ORDER BY teacher_name
    `, [start_date, end_date]);

        const headerRow1 = [
            'No', 'NIK', 'Nama Pengajar', 'Kelas yg Diajar',
            'Total Jam Pelajaran Per Pekan', '', '', '', '',  // merge E1:I1
            'Total JP'
        ];

        const headerRow2 = [
            '', '', '', '',                                   // merge ke bawah (A2:D2)
            'Pekan 1', 'Pekan 2', 'Pekan 3', 'Pekan 4', 'Pekan 5',
            ''                                                // merge ke bawah (J2)
        ];

        const dataRows = result.rows.map((row, i) => [
            i + 1,
            row.nik,
            row.nama_pengajar,
            row.kelas_diajar,
            Number(row.pekan_1),
            Number(row.pekan_2),
            Number(row.pekan_3),
            Number(row.pekan_4),
            Number(row.pekan_5),
            Number(row.total_jp),
        ]);

        const wsData = [headerRow1, headerRow2, ...dataRows];

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet(wsData);

        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
            { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
            { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
            { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
            { s: { r: 0, c: 4 }, e: { r: 0, c: 8 } },
            { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } },
        ];

        ws['!cols'] = [
            { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 20 },
            { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }
        ];

        xlsx.utils.book_append_sheet(wb, ws, 'Rekap JP');

        const filename = `rekap_${start_date}_${end_date}.xlsx`;

        // Jika ?download=true → langsung stream file ke browser (tanpa tulis ke disk)
        if (req.query.download === 'true') {
            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Length', buffer.length);
            return res.status(200).send(buffer);
        }

        // Default → kembalikan JSON berisi download_url (format lama)
        const downloadUrl = `${req.protocol}://${req.get('host')}/api/schedules/export?start_date=${start_date}&end_date=${end_date}&download=true`;

        res.status(200).json({
            status: 'Success',
            message: 'Laporan berhasil dibuat',
            download_url: downloadUrl,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'Error',
            message: 'Gagal membuat laporan.',
            error: err.message,
        });
    }
};

const getLaporanHarian = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                status: 'Bad Request',
                message: 'Parameter date wajib diisi (format: YYYY-MM-DD)'
            });
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                status: 'Bad Request',
                message: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD'
            });
        }

        const query = `
            SELECT
                teacher_nik,
                teacher_name,
                STRING_AGG(DISTINCT class_name, ', ' ORDER BY class_name) AS kelas_diajar,
                COUNT(*) AS total_sesi,
                SUM(
                    EXTRACT(EPOCH FROM (time_end::time - time_start::time)) / 3600
                ) AS total_jam,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'jam_ke',      jam_ke,
                        'class_name',  class_name,
                        'subject_code',subject_code,
                        'time_start',  time_start,
                        'time_end',    time_end
                    )
                    ORDER BY jam_ke ASC
                ) AS detail_jadwal
            FROM schedules
            WHERE date::date = $1::date
            GROUP BY teacher_nik, teacher_name
            ORDER BY teacher_name ASC;
        `;
        const result = await pool.query(query, [date]);

        const totalJpHarian = result.rows.reduce(
            (acc, r) => acc + Number(r.total_jam), 0
        );

        const rekap = result.rows.map(r => ({
            teacher_nik: r.teacher_nik,
            teacher_name: r.teacher_name,
            kelas_diajar: r.kelas_diajar,
            total_sesi: Number(r.total_sesi),
            total_jam: Number(r.total_jam),
            detail_jadwal: r.detail_jadwal
        }));

        return res.status(200).json({
            status: 'Success',
            message: 'Laporan harian berhasil diambil',
            data: {
                date,
                total_pengajar: rekap.length,
                total_jp_hari: parseFloat(totalJpHarian.toFixed(2)),
                rekap
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

const getLaporanBulanan = async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({
                status: 'Bad Request',
                message: 'Parameter year dan month wajib diisi'
            });
        }

        const y = parseInt(year, 10);
        const m = parseInt(month, 10);

        if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
            return res.status(400).json({
                status: 'Bad Request',
                message: 'year harus angka valid, month harus angka 1-12'
            });
        }

        const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        const endDate = new Date(y, m, 0).toISOString().split('T')[0]; // hari terakhir bulan

        const namaBulan = [
            '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        const query = `
            SELECT
                teacher_nik                                     AS nik,
                teacher_name                                    AS nama_pengajar,
                STRING_AGG(DISTINCT class_name, ', '
                    ORDER BY class_name)                        AS kelas_diajar,

                COALESCE(SUM(CASE WHEN pekan_ke = 1 THEN jam_jp END), 0) AS pekan_1,
                COALESCE(SUM(CASE WHEN pekan_ke = 2 THEN jam_jp END), 0) AS pekan_2,
                COALESCE(SUM(CASE WHEN pekan_ke = 3 THEN jam_jp END), 0) AS pekan_3,
                COALESCE(SUM(CASE WHEN pekan_ke = 4 THEN jam_jp END), 0) AS pekan_4,
                COALESCE(SUM(CASE WHEN pekan_ke = 5 THEN jam_jp END), 0) AS pekan_5,
                SUM(jam_jp)                                     AS total_jp

            FROM (
                SELECT
                    *,
                    EXTRACT(EPOCH FROM (time_end::time - time_start::time)) / 3600 AS jam_jp,
                    DENSE_RANK() OVER (
                        ORDER BY DATE_TRUNC('week', date::date)
                    ) AS pekan_ke
                FROM schedules
                WHERE date::date BETWEEN $1::date AND $2::date
            ) sub

            GROUP BY teacher_nik, teacher_name
            ORDER BY teacher_name ASC;
        `;
        const result = await pool.query(query, [startDate, endDate]);

        const rekap = result.rows.map((r, i) => ({
            no: i + 1,
            nik: r.nik,
            nama_pengajar: r.nama_pengajar,
            kelas_diajar: r.kelas_diajar,
            pekan_1: Number(r.pekan_1),
            pekan_2: Number(r.pekan_2),
            pekan_3: Number(r.pekan_3),
            pekan_4: Number(r.pekan_4),
            pekan_5: Number(r.pekan_5),
            total_jp: Number(r.total_jp)
        }));

        const grandTotalJp = rekap.reduce((acc, r) => acc + r.total_jp, 0);

        return res.status(200).json({
            status: 'Success',
            message: 'Laporan bulanan berhasil diambil',
            data: {
                periode: {
                    year,
                    month,
                    nama_bulan: namaBulan[m],
                    start_date: startDate,
                    end_date: endDate
                },
                total_pengajar: rekap.length,
                grand_total_jp: parseFloat(grandTotalJp.toFixed(2)),
                rekap
            }
        });
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
    getStudentSchedule,
    getTeacherSchedule,
    getYayasanReport,
    uploadExcel,
    exportExcel,
    getLaporanHarian,
    getLaporanBulanan
}