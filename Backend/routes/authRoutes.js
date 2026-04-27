import express from 'express'
import { Adminlogin, Nurselogin, Patientlogin} from '../controllers/auth.js'


const router= express.Router()


router.post('/PatientLogin', Patientlogin)
router.post('/NurseLogin', Nurselogin)
router.post('/AdminLogin', Adminlogin)


export default router
