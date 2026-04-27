import db from "../config/db.js";

export const deleteCategory = (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM categories WHERE id = ?";
    const values = [id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error deleting Category:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log('Category deleted');
        res.status(200).json({ message: "Category deleted successfully" });
    });
};


export const deleteNurse = (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM nurses WHERE id = ?";
    const values = [id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error deleting nurses:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log('nurses deleted');
        res.status(200).json({ message: "nurse deleted successfully" });
    });
};
export const deletePatient = (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM patients WHERE id = ?";
    const values = [id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error deleting patient:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log('patient deleted');
        res.status(200).json({ message: "Patient deleted successfully" });
    });
};


