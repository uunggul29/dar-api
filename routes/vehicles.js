const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ------------------------------------------------------------------
// 1. GET /vehicles/ (Get All)
// ------------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                v.id, v.number_plate, v.name, v.category, v.current_odometer,
                v.is_active, v.created_at, v.company_id, v.factory_id,
                c.name AS company_name, 
                f.name AS factory_name
            FROM vehicles v
            LEFT JOIN companies c ON v.company_id = c.id
            LEFT JOIN factories f ON v.factory_id = f.id
            WHERE v.deleted_at IS NULL
        `;
        const [rows] = await pool.execute(query);
        res.status(200).json({ message: 'Daftar kendaraan berhasil diambil', total: rows.length, data: rows });
    } catch (error) {
        console.error('Database SELECT Vehicles Error:', error);
        res.status(500).json({ message: 'Internal Server Error saat mengambil data kendaraan', error: error.message });
    }
});

// ------------------------------------------------------------------
// 2. GET /vehicles/:id (Get by ID)
// ------------------------------------------------------------------
router.get('/:id', async (req, res) => {
    const vehicleId = req.params.id;
    try {
        const query = `
            SELECT 
                v.id, v.number_plate, v.name, v.category, v.current_odometer, v.photo,
                v.is_active, v.company_id, v.factory_id, c.name AS company_name, f.name AS factory_name
            FROM vehicles v
            LEFT JOIN companies c ON v.company_id = c.id
            LEFT JOIN factories f ON v.factory_id = f.id
            WHERE v.id = ? AND v.deleted_at IS NULL
        `;
        const [rows] = await pool.execute(query, [vehicleId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Kendaraan tidak ditemukan' });
        res.status(200).json({ message: 'Data kendaraan berhasil diambil', data: rows[0] });
    } catch (error) {
        console.error('Database GET Vehicle by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// ------------------------------------------------------------------
// 3. POST /vehicles/ (Create)
// ------------------------------------------------------------------
router.post('/', async (req, res) => {
    const { number_plate, name, category, current_odometer, photo, company_id, factory_id, is_active, created_by } = req.body;
    if (!number_plate || !name || !category) return res.status(400).json({ message: 'Pelat Nomor, Nama, dan Kategori wajib diisi.' });

    const query = 'INSERT INTO vehicles (number_plate, name, category, current_odometer, photo, company_id, factory_id, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

    try {
        const [result] = await pool.execute(query, [
            number_plate, name, category, current_odometer || null, photo || null, 
            company_id || null, factory_id || null, is_active || 'Y', created_by || null
        ]);
        res.status(201).json({ message: 'Kendaraan berhasil ditambahkan', data: { id: result.insertId, number_plate, name, category } });
    } catch (error) {
        console.error('Database INSERT Vehicle Error:', error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Pelat Nomor sudah terdaftar.' });
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Company ID atau Factory ID tidak valid.' });
        res.status(500).json({ message: 'Internal Server Error saat menyimpan kendaraan', error: error.message });
    }
});

// ------------------------------------------------------------------
// 4. PUT /vehicles/:id (Update)
// ------------------------------------------------------------------
router.put('/:id', async (req, res) => {
    const vehicleId = req.params.id;
    const { number_plate, name, category, current_odometer, photo, company_id, factory_id, is_active, updated_by } = req.body;
    if (Object.keys(req.body).length === 0) return res.status(400).json({ message: 'Tidak ada data untuk diperbarui.' });

    let updateFields = [];
    let updateValues = [];

    if (number_plate !== undefined) { updateFields.push('number_plate = ?'); updateValues.push(number_plate); }
    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
    if (category !== undefined) { updateFields.push('category = ?'); updateValues.push(category); }
    if (current_odometer !== undefined) { updateFields.push('current_odometer = ?'); updateValues.push(current_odometer); }
    if (photo !== undefined) { updateFields.push('photo = ?'); updateValues.push(photo); }
    if (company_id !== undefined) { updateFields.push('company_id = ?'); updateValues.push(company_id); }
    if (factory_id !== undefined) { updateFields.push('factory_id = ?'); updateValues.push(factory_id); }
    if (is_active !== undefined) { updateFields.push('is_active = ?'); updateValues.push(is_active); }
    if (updated_by !== undefined) { updateFields.push('updated_by = ?'); updateValues.push(updated_by); }
    
    if (updateFields.length === 0) return res.status(400).json({ message: 'Tidak ada field yang valid untuk diperbarui.' });

    const query = `UPDATE vehicles SET ${updateFields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
    updateValues.push(vehicleId);

    try {
        const [result] = await pool.execute(query, updateValues);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Kendaraan tidak ditemukan atau tidak ada perubahan data.' });
        
        const [updatedRows] = await pool.execute('SELECT id, number_plate, name, category, current_odometer FROM vehicles WHERE id = ?', [vehicleId]);
        res.status(200).json({ message: 'Data kendaraan berhasil diperbarui', data: updatedRows[0] });
    } catch (error) {
        console.error('Database UPDATE Vehicle Error:', error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Pelat Nomor sudah terdaftar.' });
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Company ID atau Factory ID tidak valid.' });
        res.status(500).json({ message: 'Internal Server Error saat memperbarui kendaraan', error: error.message });
    }
});

// ------------------------------------------------------------------
// 5. DELETE /vehicles/:id (Soft Delete)
// ------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    const vehicleId = req.params.id;
    const { deleted_by } = req.body;
    if (!deleted_by) return res.status(400).json({ message: 'ID pengguna yang menghapus wajib disertakan.' });

    const query = 'UPDATE vehicles SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND deleted_at IS NULL';

    try {
        const [result] = await pool.execute(query, [deleted_by, vehicleId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Kendaraan tidak ditemukan, atau sudah dihapus sebelumnya.' });
        res.status(200).json({ message: `Kendaraan dengan ID ${vehicleId} berhasil dihapus (soft delete).`, deleted_by });
    } catch (error) {
        console.error('Database DELETE Vehicle Error:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Tidak dapat menghapus. Kendaraan ini masih terkait dengan aktivitas driver.' });
        res.status(500).json({ message: 'Internal Server Error saat menghapus kendaraan', error: error.message });
    }
});

module.exports = router;