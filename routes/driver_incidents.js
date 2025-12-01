const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ------------------------------------------------------------------
// 1. GET /driver-incidents/ (Get All)
// ------------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                di.id, di.incident_time, di.incident_name, di.incident_status, di.incident_cost, 
                da.id AS activity_id, u.username AS driver_username, v.number_plate
            FROM driver_incident di
            JOIN driver_activity da ON di.driver_activity_id = da.id
            JOIN users u ON da.user_id = u.id
            JOIN vehicles v ON da.vehicle_id = v.id
            WHERE di.deleted_at IS NULL
            ORDER BY di.incident_time DESC
        `;
        const [rows] = await pool.execute(query);
        res.status(200).json({ message: 'Daftar insiden driver berhasil diambil', total: rows.length, data: rows });
    } catch (error) {
        console.error('Database SELECT Driver Incident Error:', error);
        res.status(500).json({ message: 'Internal Server Error saat mengambil data insiden driver', error: error.message });
    }
});

// ------------------------------------------------------------------
// 2. GET /driver-incidents/:id (Get by ID)
// ------------------------------------------------------------------
router.get('/:id', async (req, res) => {
    const incidentId = req.params.id;
    try {
        const query = 'SELECT * FROM driver_incident WHERE id = ? AND deleted_at IS NULL';
        const [rows] = await pool.execute(query, [incidentId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Insiden tidak ditemukan' });
        res.status(200).json({ message: 'Data insiden berhasil diambil', data: rows[0] });
    } catch (error) {
        console.error('Database GET Incident by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// ------------------------------------------------------------------
// 3. POST /driver-incidents/ (Create)
// ------------------------------------------------------------------
router.post('/', async (req, res) => {
    const { 
        driver_activity_id, incident_time, incident_name, incident_description, 
        destination_latitude, destination_longitude, incident_cost, incident_status, created_by
    } = req.body;

    if (!driver_activity_id || !incident_name) return res.status(400).json({ message: 'Driver Activity ID dan Nama Insiden wajib diisi.' });
    
    const status = incident_status || 'Draft'; 
    const time = incident_time || new Date().toISOString().slice(0, 19).replace('T', ' ');

    const query = `
        INSERT INTO driver_incident 
        (driver_activity_id, incident_time, incident_name, incident_description, 
        destination_latitude, destination_longitude, incident_cost, incident_status, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        const [result] = await pool.execute(query, [
            driver_activity_id, time, incident_name, incident_description || null, 
            destination_latitude || null, destination_longitude || null, incident_cost || null, status, created_by || null
        ]);

        res.status(201).json({ message: 'Insiden driver berhasil dicatat', data: { id: result.insertId, driver_activity_id, incident_name, incident_status: status } });
    } catch (error) {
        console.error('Database INSERT Driver Incident Error:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Driver Activity ID tidak valid.' });
        res.status(500).json({ message: 'Internal Server Error saat mencatat insiden driver', error: error.message });
    }
});

// ------------------------------------------------------------------
// 4. PUT /driver-incidents/:id (Update)
// ------------------------------------------------------------------
router.put('/:id', async (req, res) => {
    const incidentId = req.params.id;
    const { incident_time, incident_name, incident_description, incident_cost, incident_status, updated_by } = req.body;
    if (Object.keys(req.body).length === 0) return res.status(400).json({ message: 'Tidak ada data untuk diperbarui.' });

    let updateFields = [];
    let updateValues = [];

    if (incident_time !== undefined) { updateFields.push('incident_time = ?'); updateValues.push(incident_time); }
    if (incident_name !== undefined) { updateFields.push('incident_name = ?'); updateValues.push(incident_name); }
    if (incident_description !== undefined) { updateFields.push('incident_description = ?'); updateValues.push(incident_description); }
    if (incident_cost !== undefined) { updateFields.push('incident_cost = ?'); updateValues.push(incident_cost); }
    if (incident_status !== undefined) { updateFields.push('incident_status = ?'); updateValues.push(incident_status); }
    if (updated_by !== undefined) { updateFields.push('updated_by = ?'); updateValues.push(updated_by); }
    
    if (updateFields.length === 0) return res.status(400).json({ message: 'Tidak ada field yang valid untuk diperbarui.' });

    const query = `UPDATE driver_incident SET ${updateFields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
    updateValues.push(incidentId);

    try {
        const [result] = await pool.execute(query, updateValues);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Insiden tidak ditemukan atau tidak ada perubahan data.' });
        
        const [updatedRows] = await pool.execute('SELECT * FROM driver_incident WHERE id = ?', [incidentId]);
        res.status(200).json({ message: 'Data insiden berhasil diperbarui', data: updatedRows[0] });
    } catch (error) {
        console.error('Database UPDATE Incident Error:', error);
        res.status(500).json({ message: 'Internal Server Error saat memperbarui insiden', error: error.message });
    }
});

// ------------------------------------------------------------------
// 5. DELETE /driver-incidents/:id (Soft Delete)
// ------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    const incidentId = req.params.id;
    const { deleted_by } = req.body;
    if (!deleted_by) return res.status(400).json({ message: 'ID pengguna yang menghapus wajib disertakan.' });

    const query = 'UPDATE driver_incident SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND deleted_at IS NULL';

    try {
        const [result] = await pool.execute(query, [deleted_by, incidentId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Insiden tidak ditemukan, atau sudah dihapus sebelumnya.' });
        res.status(200).json({ message: `Insiden dengan ID ${incidentId} berhasil dihapus (soft delete).`, deleted_by });
    } catch (error) {
        console.error('Database DELETE Incident Error:', error);
        res.status(500).json({ message: 'Internal Server Error saat menghapus insiden', error: error.message });
    }
});

module.exports = router;