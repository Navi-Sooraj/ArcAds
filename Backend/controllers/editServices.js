import db from "../config/db.js";


export const updateCategory = (req, res) => {
    const { id, name } = req.body;

    const sql = "UPDATE categories SET name = ? WHERE id = ?";
    const values = [name,id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating category:', err);
            res.status(500).json({ error: 'Error updating category' });
            return;
        }
        console.log('category updated successfully');
        res.status(200).json({ message: 'category updated successfully' });
    });
}

export const updateNurses = (req, res) => {
    const{id}=req.params
    const {  name, email, password, phone_number, address, category } = req.body;
  
    const sql = "UPDATE nurses SET name = ?, email = ?, password = ?, phone_number = ?, address = ?, category = ? WHERE id = ?";
    const values = [name, email, password, phone_number, address, category,id];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error updating nurse:', err);
        res.status(500).json({ error: 'Error updating nurse' });
        return;
      }
      console.log('Nurse updated successfully');
      res.status(200).json({ message: 'Nurse updated successfully' });
    });
  };
export const updatePatient = (req, res) => {
    const{id}=req.params
    const {  name, email,phone, address} = req.body;
  
    const sql = "UPDATE patients SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?";
    const values = [name, email,phone ,address,id];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error updating patient:', err);
        res.status(500).json({ error: 'Error updating patient' });
        return;
      }
      console.log('patient updated successfully');
      res.status(200).json({ message: 'patient updated successfully' });
    });
  };


  export const updateRequest = (req, res) => {
    const { id } = req.params;
    const { nurse_id,reqStatus,nurses_status } = req.body;

    const sql = "UPDATE requests SET status = ?, nurse_id = ? WHERE id = ?";
    const sql2 = "UPDATE nurses SET status = ? WHERE id = ?";
    const values = [reqStatus,nurse_id, id];
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating request:', err);
            res.status(500).json({ error: 'Error updating request' });
            return;
        }
        db.query(sql2, [nurses_status,nurse_id], (err2, result2) => {
            if (err2) {
                console.error('Error updating nurse status:', err2);
                res.status(500).json({ error: 'Error updating nurse status' });
                return;
            }
            console.log('Request and nurse status updated successfully');
            res.status(200).json({ message: 'Request and nurse status updated successfully' });
        });
    });
};
