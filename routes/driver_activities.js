const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ------------------------------------------------------------------
// 1. GET /driver-activities/ (Get All)
// ------------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                da.id, da.departure_at, da.origin, da.arrival_at, da.destination, 
                da.odometer_before, da.odometer_after, da.created_at,
                u.username AS driver_username, 
                v.number_plate AS vehicle_plate
            FROM driver_activity da
            JOIN users u ON da.user_id = u.id
            JOIN vehicles v ON da.vehicle_id = v.id
            WHERE da.deleted_at IS NULL
            ORDER BY da.departure_at DESC
        `;
        const [rows] = await pool.execute(query);
        res.status(200).json({ message: 'Daftar aktivitas driver berhasil diambil', total: rows.length, data: rows });
    } catch (error) {
        console.error('Database SELECT Driver Activity Error:', error);
        res.status(500).json({ message: 'Internal Server Error saat mengambil data aktivitas driver', error: error.message });
    }
});

// ------------------------------------------------------------------
// 2. GET /driver-activities/:id (Get by ID)
// ------------------------------------------------------------------
router.get('/:id', async (req, res) => {
    const activityId = req.params.id;
    try {
        const query = 'SELECT * FROM driver_activity WHERE id = ? AND deleted_at IS NULL';
        const [rows] = await pool.execute(query, [activityId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Aktivitas tidak ditemukan' });
        res.status(200).json({ message: 'Data aktivitas berhasil diambil', data: rows[0] });
    } catch (error) {
        console.error('Database GET Activity by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// ------------------------------------------------------------------
// 3. POST /driver-activities/ (Create - Departure Only)
// ------------------------------------------------------------------
router.post('/', async (req, res) => {
    const { user_id, vehicle_id, origin, origin_photo, origin_latitude, origin_longitude, odometer_before, created_by } = req.body;
    if (!user_id || !vehicle_id || !odometer_before) return res.status(400).json({ message: 'User ID, Vehicle ID, dan Odometer Awal wajib diisi.' });

    const query = `
        INSERT INTO driver_activity 
        (user_id, vehicle_id, departure_at, origin, origin_photo, origin_latitude, origin_longitude, odometer_before, created_by) 
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)
    `;

    try {
        const [result] = await pool.execute(query, [
            user_id, vehicle_id, origin || null, origin_photo || null, 
            origin_latitude || null, origin_longitude || null, odometer_before, created_by || null
        ]);

        res.status(201).json({ 
            message: 'Aktivitas driver (keberangkatan) berhasil dicatat', 
            data: { id: result.insertId, user_id, vehicle_id, odometer_before } 
        });
    } catch (error) {
        console.error('Database INSERT Driver Activity Error:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'User ID atau Vehicle ID tidak valid.' });
        res.status(500).json({ message: 'Internal Server Error saat mencatat aktivitas', error: error.message });
    }
});

// ------------------------------------------------------------------
// 4. PUT /driver-activities/:id (Update - Arrival/Completion)
// ------------------------------------------------------------------
// Endpoint ini biasanya digunakan untuk mencatat KEDATANGAN
router.put('/:id', async (req, res) => {
    const activityId = req.params.id;
    const { arrival_at, destination, destination_photo, destination_latitude, destination_longitude, odometer_after, updated_by } = req.body;
    if (Object.keys(req.body).length === 0) return res.status(400).json({ message: 'Tidak ada data untuk diperbarui.' });

    let updateFields = [];
    let updateValues = [];

    // Jika mencatat kedatangan, pastikan odometer_after dikirim
    if (odometer_after !== undefined) { updateFields.push('odometer_after = ?'); updateValues.push(odometer_after); }
    if (arrival_at !== undefined) { updateFields.push('arrival_at = ?'); updateValues.push(arrival_at); }
    if (destination !== undefined) { updateFields.push('destination = ?'); updateValues.push(destination); }
    if (destination_photo !== undefined) { updateFields.push('destination_photo = ?'); updateValues.push(destination_photo); }
    if (destination_latitude !== undefined) { updateFields.push('destination_latitude = ?'); updateValues.push(destination_latitude); }
    if (destination_longitude !== undefined) { updateFields.push('destination_longitude = ?'); updateValues.push(destination_longitude); }
    if (updated_by !== undefined) { updateFields.push('updated_by = ?'); updateValues.push(updated_by); }
    
    if (updateFields.length === 0) return res.status(400).json({ message: 'Tidak ada field yang valid untuk diperbarui.' });

    const query = `UPDATE driver_activity SET ${updateFields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
    updateValues.push(activityId);

    try {
        const [result] = await pool.execute(query, updateValues);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Aktivitas tidak ditemukan atau sudah selesai.' });
        
        const [updatedRows] = await pool.execute('SELECT * FROM driver_activity WHERE id = ?', [activityId]);
        res.status(200).json({ message: 'Data aktivitas driver berhasil diperbarui (Kedatangan)', data: updatedRows[0] });
    } catch (error) {
        console.error('Database UPDATE Activity Error:', error);
        res.status(500).json({ message: 'Internal Server Error saat memperbarui aktivitas', error: error.message });
    }
});

// ------------------------------------------------------------------
// 5. DELETE /driver-activities/:id (Soft Delete)
// ------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    const activityId = req.params.id;
    const { deleted_by } = req.body;
    if (!deleted_by) return res.status(400).json({ message: 'ID pengguna yang menghapus wajib disertakan.' });

    const query = 'UPDATE driver_activity SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND deleted_at IS NULL';

    try {
        const [result] = await pool.execute(query, [deleted_by, activityId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Aktivitas tidak ditemukan, atau sudah dihapus sebelumnya.' });
        res.status(200).json({ message: `Aktivitas driver dengan ID ${activityId} berhasil dihapus (soft delete).`, deleted_by });
    } catch (error) {
        console.error('Database DELETE Activity Error:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Tidak dapat menghapus. Aktivitas ini masih memiliki insiden terkait.' });
        res.status(500).json({ message: 'Internal Server Error saat menghapus aktivitas', error: error.message });
    }
});

module.exports = router;