import db from "../config/db.js";

export const Patientlogin = (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM patients WHERE reg_no = ? AND phone = ?";
    const values = [email, password];

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            res.status(500).json({ error: 'Error during login' });
            return;
        }

        if (results.length === 0) {
            res.status(401).json({ error: 'Invalid register number or phonenumber' });
            return;
        }

        const user = results[0];
        res.status(200).json({ message: 'Login successful', user });
        console.log("Login successfull",user);
    });
};

export const Nurselogin = (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM nurses WHERE email = ? AND password = ?";
    const values = [email, password];

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            res.status(500).json({ error: 'Error during login' });
            return;
        }

        if (results.length === 0) {
            res.status(401).json({ error: 'Invalid register number or phonenumber' });
            return;
        }

        const user = results[0];
        res.status(200).json({ message: 'Login successful', user });
        console.log("Login successfull",user);
    });
};


export const Adminlogin = (req, res) => {
    const { email, password } = req.body;
    console.log("hyeeeee");
    const sql = "SELECT * FROM admin WHERE email = ? AND password = ?";
    const values = [email, password];

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            res.status(500).json({ error: 'Error during login' });
            return;
        }

        if (results.length === 0) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const user = results[0];
        res.status(200).json({ message: 'Login successful', user });
        console.log("Admin Login successfull",user);
    });
};