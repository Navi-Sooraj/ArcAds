import express from "express";
import { deleteCategory, deleteNurse, deletePatient} from "../controllers/deleteServices.js";

const router=express.Router();

router.delete('/deleteCategory/:id', deleteCategory)
router.delete('/deleteNurse/:id', deleteNurse)
router.delete('/deletePatient/:id', deletePatient)

export default router