import db from "../config/db.js";


export const getAllCategory = (req,res)=>{
  const sql = "Select * from categories ";
  db.query(sql,(err, result) => {
    if (err) {
      console.error('Error getting products:', err);
      res.status(500).json({ error: 'Error ' });
      return;
    }
    console.log('category successfully fetched');
    res.status(200).json({ data:result });
  });
}

export const getAllNurses = (req,res)=>{

    const sql = "Select * from nurses";
  
    db.query(sql, (err, result) => {
      if (err) {
        console.error('Error getting nurses:', err);
        res.status(500).json({ error: 'Error ' });
        return;
      }
      console.log('nurses retrieved');
      res.status(200).json({ data:result });
    });
}
export const getAllPatients = (req,res)=>{
    const sql = "Select * from patients ";
    db.query(sql,(err, result) => {
      if (err) {
        console.error('Error getting patients:', err);
        res.status(500).json({ error: 'Error ' });
        return;
      }
      console.log('Patients fetched successfully ');
      res.status(200).json({ data:result });
    });
}
export const getAllStaffs = (req,res)=>{
    const sql = "Select * from users ";
    db.query(sql,(err, result) => {
      if (err) {
        console.error('Error getting patients:', err);
        res.status(500).json({ error: 'Error ' });
        return;
      }
      console.log('success');
      res.status(200).json({ data:result });
    });
}



export const getAllCategories = (req, res) => {
  const getAllInvoicesQuery = "SELECT * FROM categories";

  db.query(getAllInvoicesQuery, (error, results) => {
    if (error) {
      console.error('Error retrieving invoices:', error);
      res.status(500).json({ error: 'Error retrieving invoices' });
      return;
    }

    res.status(200).json({ data:results });
  });
}
export const getAllFeedbacks = (req, res) => {
  const getAllInvoicesQuery = "SELECT * FROM feedbacks";

  db.query(getAllInvoicesQuery, (error, results) => {
    if (error) {
      console.error('Error retrieving feedbacks:', error);
      res.status(500).json({ error: 'Error retrieving feedbacks' });
      return;
    }

    res.status(200).json({ data:results });
  });
}


export const getAllRequests = (req, res) => {
  const sql = "SELECT requests.*, categories.name AS service_name, patients.name AS patient_name FROM requests \
              LEFT JOIN categories ON requests.service = categories.id \
              LEFT JOIN patients ON requests.patient_id = patients.id";

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error retrieving requests:', error);
      res.status(500).json({ error: 'Error retrieving requests' });
      return;
    }

    res.status(200).json({ data: results });
  })}

