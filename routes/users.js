const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ------------------------------------------------------------------
// 1. ENDPOINT: GET /users/ (Get All Users)
// ------------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT id, username, email, company_id, factory_id, is_active, created_at FROM users WHERE deleted_at IS NULL';
        const [rows] = await pool.execute(query);

        res.status(200).json({
            message: 'Daftar pengguna berhasil diambil',
            total: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Database SELECT Error:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
});

// ------------------------------------------------------------------
// 2. ENDPOINT: POST /users/ (Create User)
// ------------------------------------------------------------------
router.post('/', async (req, res) => {
    const { username, email, password, company_id, factory_id } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, dan password wajib diisi.' });
    }

    const query = `
        INSERT INTO users 
        (username, email, password, company_id, factory_id) 
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        const [result] = await pool.execute(query, [username, email, password, company_id || null, factory_id || null]);

        const newUser = {
            id: result.insertId,
            username: username,
            email: email,
            company_id: company_id,
            factory_id: factory_id
        };

        res.status(201).json({
            message: 'User berhasil didaftarkan ke database',
            data: newUser
        });

    } catch (error) {
        console.error('Database INSERT Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username atau Email sudah terdaftar.' });
        }

        res.status(500).json({
            message: 'Internal Server Error saat menyimpan user',
            error: error.message
        });
    }
});

// ------------------------------------------------------------------
// 3. ENDPOINT: GET /users/:id (Get Single User by ID)
// ------------------------------------------------------------------
router.get('/:id', async (req, res) => {
    const userId = req.params.id; // Ambil ID dari parameter URL

    try {
        const query = 'SELECT id, username, email, company_id, factory_id, is_active FROM users WHERE id = ? AND deleted_at IS NULL';
        const [rows] = await pool.execute(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Pengguna tidak ditemukan'
            });
        }

        // Mengembalikan status 200 OK dan data user tunggal
        res.status(200).json({
            message: 'Data pengguna berhasil diambil',
            data: rows[0]
        });

    } catch (error) {
        console.error('Database GET by ID Error:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
});

// ------------------------------------------------------------------
// 4. ENDPOINT: PUT /users/:id (Update User)
// ------------------------------------------------------------------
router.put('/:id', async (req, res) => {
    const userId = req.params.id;
    const { username, email, password, company_id, factory_id, is_active, updated_by } = req.body;

    // Cek apakah ada data yang dikirim untuk update
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Tidak ada data untuk diperbarui.' });
    }

    // Bangun query secara dinamis
    let updateFields = [];
    let updateValues = [];

    if (username !== undefined) {
        updateFields.push('username = ?');
        updateValues.push(username);
    }
    if (email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(email);
    }
    // Note: Di produksi, password harus di-hash di sini sebelum disimpan!
    if (password !== undefined) {
        updateFields.push('password = ?');
        updateValues.push(password);
    }
    if (company_id !== undefined) {
        updateFields.push('company_id = ?');
        updateValues.push(company_id);
    }
    if (factory_id !== undefined) {
        updateFields.push('factory_id = ?');
        updateValues.push(factory_id);
    }
    if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(is_active);
    }
    if (updated_by !== undefined) {
        updateFields.push('updated_by = ?');
        updateValues.push(updated_by);
    }
    // updated_at akan diisi otomatis oleh trigger ON UPDATE CURRENT_TIMESTAMP di DB

    // Jika tidak ada field valid yang dikirim
    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'Tidak ada field yang valid untuk diperbarui.' });
    }

    const query = `
        UPDATE users 
        SET ${updateFields.join(', ')} 
        WHERE id = ? AND deleted_at IS NULL
    `;
    updateValues.push(userId); // Tambahkan userId sebagai parameter terakhir untuk WHERE

    try {
        const [result] = await pool.execute(query, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan atau tidak ada perubahan data.' });
        }

        // Ambil data terbaru setelah update (opsional, tapi disarankan)
        const [updatedRows] = await pool.execute('SELECT id, username, email, company_id, factory_id, is_active FROM users WHERE id = ?', [userId]);

        res.status(200).json({
            message: 'Data pengguna berhasil diperbarui',
            data: updatedRows[0]
        });

    } catch (error) {
        console.error('Database UPDATE Error:', error);
        
        // Penanganan error Foreign Key atau Duplikasi
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'Username atau Email sudah terdaftar.' });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'Company ID atau Factory ID tidak valid.' });
        }

        res.status(500).json({
            message: 'Internal Server Error saat memperbarui user',
            error: error.message
        });
    }
});

// ------------------------------------------------------------------
// 5. ENDPOINT: DELETE /users/:id (Soft Delete User)
// ------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    const userId = req.params.id;
    const { deleted_by } = req.body; // Menerima ID user yang menghapus

    // Validasi untuk memastikan user yang menghapus dikirim
    if (!deleted_by) {
        return res.status(400).json({ message: 'ID pengguna yang menghapus (deleted_by) wajib disertakan dalam body.' });
    }

    // Query Soft Delete: Set deleted_at ke waktu saat ini (NOW()) dan isi deleted_by
    const query = `
        UPDATE users 
        SET deleted_at = NOW(), deleted_by = ? 
        WHERE id = ? AND deleted_at IS NULL
    `;

    try {
        const [result] = await pool.execute(query, [deleted_by, userId]);

        if (result.affectedRows === 0) {
            // Jika affectedRows = 0, berarti user sudah dihapus atau ID tidak ditemukan
            return res.status(404).json({ 
                message: 'Pengguna tidak ditemukan, atau sudah dihapus sebelumnya.' 
            });
        }

        res.status(200).json({
            message: `Pengguna dengan ID ${userId} berhasil dihapus (soft delete).`,
            deleted_by: deleted_by
        });

    } catch (error) {
        console.error('Database DELETE Error:', error);
        res.status(500).json({
            message: 'Internal Server Error saat menghapus user',
            error: error.message
        });
    }
});

module.exports = router;