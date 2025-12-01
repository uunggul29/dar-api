const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ------------------------------------------------------------------
// 1. GET /factories/ (Get All)
// ------------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT f.id, f.company_id, f.name, f.address, f.phone, f.is_active, c.name AS company_name
            FROM factories f
            JOIN companies c ON f.company_id = c.id
            WHERE f.deleted_at IS NULL
        `;
        const [rows] = await pool.execute(query);
        res.status(200).json({ message: 'Daftar pabrik berhasil diambil', total: rows.length, data: rows });
    } catch (error) {
        console.error('Database SELECT Factories Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// ------------------------------------------------------------------
// 2. GET /factories/:id (Get by ID)
// ------------------------------------------------------------------
router.get('/:id', async (req, res) => {
    const factoryId = req.params.id;
    try {
        const query = 'SELECT id, company_id, name, address, phone, is_active FROM factories WHERE id = ? AND deleted_at IS NULL';
        const [rows] = await pool.execute(query, [factoryId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Pabrik tidak ditemukan' });
        res.status(200).json({ message: 'Data pabrik berhasil diambil', data: rows[0] });
    } catch (error) {
        console.error('Database GET Factory by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// ------------------------------------------------------------------
// 3. POST /factories/ (Create)
// ------------------------------------------------------------------
router.post('/', async (req, res) => {
    const { company_id, name, address, phone, is_active, created_by } = req.body;
    if (!company_id || !name) return res.status(400).json({ message: 'ID Perusahaan dan Nama pabrik wajib diisi.' });

    const query = 'INSERT INTO factories (company_id, name, address, phone, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?)';

    try {
        const [result] = await pool.execute(query, [company_id, name, address || null, phone || null, is_active || 'Y', created_by || null]);
        res.status(201).json({ message: 'Pabrik berhasil ditambahkan', data: { id: result.insertId, company_id, name } });
    } catch (error) {
        console.error('Database INSERT Factory Error:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Company ID tidak ditemukan.' });
        res.status(500).json({ message: 'Internal Server Error saat menyimpan pabrik', error: error.message });
    }
});

// ------------------------------------------------------------------
// 4. PUT /factories/:id (Update)
// ------------------------------------------------------------------
router.put('/:id', async (req, res) => {
    const factoryId = req.params.id;
    const { company_id, name, address, phone, is_active, updated_by } = req.body;
    if (Object.keys(req.body).length === 0) return res.status(400).json({ message: 'Tidak ada data untuk diperbarui.' });

    let updateFields = [];
    let updateValues = [];

    if (company_id !== undefined) { updateFields.push('company_id = ?'); updateValues.push(company_id); }
    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
    if (address !== undefined) { updateFields.push('address = ?'); updateValues.push(address); }
    if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone); }
    if (is_active !== undefined) { updateFields.push('is_active = ?'); updateValues.push(is_active); }
    if (updated_by !== undefined) { updateFields.push('updated_by = ?'); updateValues.push(updated_by); }
    
    if (updateFields.length === 0) return res.status(400).json({ message: 'Tidak ada field yang valid untuk diperbarui.' });

    const query = `UPDATE factories SET ${updateFields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
    updateValues.push(factoryId);

    try {
        const [result] = await pool.execute(query, updateValues);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Pabrik tidak ditemukan atau tidak ada perubahan data.' });
        
        const [updatedRows] = await pool.execute('SELECT id, company_id, name, address, phone, is_active FROM factories WHERE id = ?', [factoryId]);
        res.status(200).json({ message: 'Data pabrik berhasil diperbarui', data: updatedRows[0] });
    } catch (error) {
        console.error('Database UPDATE Factory Error:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Company ID tidak valid.' });
        res.status(500).json({ message: 'Internal Server Error saat memperbarui pabrik', error: error.message });
    }
});

// ------------------------------------------------------------------
// 5. DELETE /factories/:id (Soft Delete)
// ------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    const factoryId = req.params.id;
    const { deleted_by } = req.body;
    if (!deleted_by) return res.status(400).json({ message: 'ID pengguna yang menghapus wajib disertakan.' });

    const query = 'UPDATE factories SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND deleted_at IS NULL';

    try {
        const [result] = await pool.execute(query, [deleted_by, factoryId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Pabrik tidak ditemukan, atau sudah dihapus sebelumnya.' });
        res.status(200).json({ message: `Pabrik dengan ID ${factoryId} berhasil dihapus (soft delete).`, deleted_by });
    } catch (error) {
        console.error('Database DELETE Factory Error:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Tidak dapat menghapus. Pabrik ini masih memiliki data terkait (pengguna atau kendaraan).' });
        res.status(500).json({ message: 'Internal Server Error saat menghapus pabrik', error: error.message });
    }
});

module.exports = router;