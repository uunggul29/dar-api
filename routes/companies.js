// routes/companies.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ------------------------------------------------------------------
// 1. ENDPOINT: GET /companies/ (Get All Companies)
// ------------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT id, name, address, phone, is_active, created_at FROM companies WHERE deleted_at IS NULL';
        const [rows] = await pool.execute(query);

        res.status(200).json({
            message: 'Daftar perusahaan berhasil diambil',
            total: rows.length,
            data: rows
        });

    } catch (error) {
        console.error('Database SELECT Companies Error:', error);
        res.status(500).json({
            message: 'Internal Server Error saat mengambil data perusahaan',
            error: error.message
        });
    }
});

// ------------------------------------------------------------------
// 2. ENDPOINT: POST /companies/ (Create Company)
// ------------------------------------------------------------------
router.post('/', async (req, res) => {
    const { name, address, phone, is_active, created_by } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Nama perusahaan wajib diisi.' });
    }

    const query = `
        INSERT INTO companies 
        (name, address, phone, is_active, created_by) 
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        const [result] = await pool.execute(query, [
            name,
            address || null,
            phone || null,
            is_active || 'Y',
            created_by || null
        ]);

        const newCompany = {
            id: result.insertId,
            name: name,
            address: address,
            phone: phone
        };

        res.status(201).json({
            message: 'Perusahaan berhasil ditambahkan',
            data: newCompany
        });

    } catch (error) {
        console.error('Database INSERT Company Error:', error);
        res.status(500).json({
            message: 'Internal Server Error saat menyimpan perusahaan',
            error: error.message
        });
    }
});


// ------------------------------------------------------------------
// 3. ENDPOINT: GET /companies/:id (Get Single Company by ID)
// ------------------------------------------------------------------
router.get('/:id', async (req, res) => {
    const companyId = req.params.id;

    try {
        const query = 'SELECT id, name, address, phone, is_active FROM companies WHERE id = ? AND deleted_at IS NULL';
        const [rows] = await pool.execute(query, [companyId]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Perusahaan tidak ditemukan'
            });
        }

        res.status(200).json({
            message: 'Data perusahaan berhasil diambil',
            data: rows[0]
        });

    } catch (error) {
        console.error('Database GET Company by ID Error:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
});


// ------------------------------------------------------------------
// 4. ENDPOINT: PUT /companies/:id (Update Company)
// ------------------------------------------------------------------
router.put('/:id', async (req, res) => {
    const companyId = req.params.id;
    const { name, address, phone, is_active, updated_by } = req.body;

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Tidak ada data untuk diperbarui.' });
    }

    // Bangun query secara dinamis
    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
    }
    if (address !== undefined) {
        updateFields.push('address = ?');
        updateValues.push(address);
    }
    if (phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
    }
    if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(is_active);
    }
    if (updated_by !== undefined) {
        updateFields.push('updated_by = ?');
        updateValues.push(updated_by);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'Tidak ada field yang valid untuk diperbarui.' });
    }

    const query = `
        UPDATE companies 
        SET ${updateFields.join(', ')} 
        WHERE id = ? AND deleted_at IS NULL
    `;
    updateValues.push(companyId);

    try {
        const [result] = await pool.execute(query, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Perusahaan tidak ditemukan atau tidak ada perubahan data.' });
        }

        // Ambil data terbaru setelah update
        const [updatedRows] = await pool.execute('SELECT id, name, address, phone, is_active FROM companies WHERE id = ?', [companyId]);

        res.status(200).json({
            message: 'Data perusahaan berhasil diperbarui',
            data: updatedRows[0]
        });

    } catch (error) {
        console.error('Database UPDATE Company Error:', error);
        res.status(500).json({
            message: 'Internal Server Error saat memperbarui perusahaan',
            error: error.message
        });
    }
});


// ------------------------------------------------------------------
// 5. ENDPOINT: DELETE /companies/:id (Soft Delete Company)
// ------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    const companyId = req.params.id;
    const { deleted_by } = req.body;

    if (!deleted_by) {
        return res.status(400).json({ message: 'ID pengguna yang menghapus (deleted_by) wajib disertakan.' });
    }

    // Query Soft Delete: Perusahaan memiliki relasi ke factories, users, dan vehicles
    // ON DELETE RESTRICT di FK SQL akan mencegah penghapusan jika data child masih ada.
    const query = `
        UPDATE companies 
        SET deleted_at = NOW(), deleted_by = ? 
        WHERE id = ? AND deleted_at IS NULL
    `;

    try {
        const [result] = await pool.execute(query, [deleted_by, companyId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'Perusahaan tidak ditemukan, atau sudah dihapus sebelumnya.' 
            });
        }

        res.status(200).json({
            message: `Perusahaan dengan ID ${companyId} berhasil dihapus (soft delete).`,
            deleted_by: deleted_by
        });

    } catch (error) {
        console.error('Database DELETE Company Error:', error);
        
        // Penanganan Error Foreign Key
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ message: 'Tidak dapat menghapus. Perusahaan ini masih memiliki data terkait (pabrik, pengguna, atau kendaraan).' });
        }
        
        res.status(500).json({
            message: 'Internal Server Error saat menghapus perusahaan',
            error: error.message
        });
    }
});
module.exports = router;