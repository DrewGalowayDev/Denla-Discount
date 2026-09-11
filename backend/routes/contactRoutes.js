const express = require('express');
const router = express.Router();
const { query, queryOne, generateUUID } = require('../config/database');

/**
 * @route   POST /api/contact
 * @desc    Submit contact form
 * @access  Public
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, project, subject, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required fields'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        const id = generateUUID();
        await query(
            `INSERT INTO contact_messages (id, name, email, phone, project, subject, message, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'new')`,
            [
                id,
                name.trim(),
                email.trim().toLowerCase(),
                phone ? phone.trim() : null,
                project ? project.trim() : null,
                subject ? subject.trim() : null,
                message.trim()
            ]
        );

        const savedMessage = await queryOne('SELECT * FROM contact_messages WHERE id = ?', [id]);

        res.status(201).json({
            success: true,
            message: 'Thank you for contacting us! We will get back to you soon.',
            data: savedMessage
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while submitting your message'
        });
    }
});

/**
 * @route   GET /api/contact
 * @desc    Get all contact messages (Admin only)
 * @access  Private/Admin
 */
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;

        let sql = 'SELECT * FROM contact_messages';
        const params = [];

        if (status) {
            sql += ' WHERE status = ?';
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC';

        const data = await query(sql, params);

        res.status(200).json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {
        console.error('Fetch contact messages error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching messages',
            error: error.message
        });
    }
});

/**
 * @route   PATCH /api/contact/:id
 * @desc    Update contact message status (Admin only)
 * @access  Private/Admin
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['new', 'read', 'replied', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: new, read, replied, or archived'
            });
        }

        await query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
        const updatedMessage = await queryOne('SELECT * FROM contact_messages WHERE id = ?', [id]);

        if (!updatedMessage) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Message status updated successfully',
            data: updatedMessage
        });

    } catch (error) {
        console.error('Update message error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the message'
        });
    }
});

module.exports = router;
