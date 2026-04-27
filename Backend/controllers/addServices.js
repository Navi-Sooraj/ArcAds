import db from '../config/db.js'



export const addCategory = (req,res)=>{
    const { name} = req.body;

    const sql = "INSERT INTO categories (name) VALUES (?)";
    console.log(name);   
    const values = [name];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error adding category:', err);
        res.status(500).json({ error: 'Error adding category' });
        return;
      }
      console.log('category added successfully');
      res.status(200).json({ message: 'category added successfully' });
    });
}
export const addNurses = (req,res)=>{
    const { name, email, password, phone_number, address, category } = req.body;
    console.log(req.body);

    const sql = "INSERT INTO nurses (name, email, password, phone_number, address, category) VALUES ( ?, ?, ?, ?, ?, ?)";
    const values = [name, email, password, phone_number, address,category];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error adding nurses:', err);
        res.status(500).json({ error: 'Error adding nurses' });
        return;
      }
      console.log('nurses added successfully');
      res.status(200).json({ message: 'nurses added successfully' });
    });
}


export const addPatients = (req, res) => {
  const { name, email, phone, address } = req.body;

  const getLastInvoiceNumberQuery = "SELECT reg_no FROM patients ORDER BY id DESC LIMIT 1";

  db.query(getLastInvoiceNumberQuery, (error, results) => {
      if (error) {
          console.error('Error retrieving last invoice number:', error);
          res.status(500).json({ error: 'Error retrieving last invoice number' });
          return;
      }

      let lastInvoiceNumber;
      if (results.length > 0) {
          lastInvoiceNumber = parseInt(results[0].reg_no);
      } else {
          lastInvoiceNumber = 100011022024001; 
      }

      const nextInvoiceNumber = lastInvoiceNumber + 1;
      console.log(nextInvoiceNumber);

      const sql = "INSERT INTO patients (name, email, phone, address, reg_no) VALUES (?, ?, ?, ?, ?)";
      const values = [name, email, phone, address, nextInvoiceNumber];

      db.query(sql, values, (err, result) => {
          if (err) {
              console.error('Error adding patients:', err);
              res.status(500).json({ error: 'Error adding patients' });
              return;
          }
          console.log('patients added successfully');
          res.status(200).json({ message: 'patients added successfully' });
      });
  });
};
export const addFeedback = (req, res) => {
  const { nurse_id, patient_id, service_id, feedback } = req.body;
const values=[nurse_id, patient_id, service_id, feedback ]
console.log(values);
const sql = `INSERT INTO feedbacks (nurse_id, patient_id, service_id, feedback)  
               VALUES(?, ?, ?, ?)`;
      db.query(sql, values, (err, result) => {
          if (err) {
              console.error('Error adding feedbacks:', err);
              res.status(500).json({ error: 'Error adding feedbacks' });
              return;
          }
          console.log('feedbacks added successfully');
          res.status(200).json({ message: 'feedbacks added successfully' });
      })};


export const addRequest = (req, res) => {
  const { service, patient_id } = req.body;
  const requestSql = "INSERT INTO requests (service,patient_id) VALUES (?, ?)";
  const values = [service, patient_id];

  db.query(requestSql, values, (err, result) => { // Change 'res' to 'result' here
    if (err) {
      console.error('Error adding invoice:', err);
      res.status(500).json({ error: 'Error adding invoice' });
      return;
    }
    console.log('service requested successfully');
    res.status(200).json({ message: 'service requested successfully' });
  });
};



