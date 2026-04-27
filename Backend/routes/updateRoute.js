import express from 'express'
import { updateCategory, updateNurses, updatePatient, updateRequest } from '../controllers/editServices.js'

const router= express.Router()

router.put('/UpdateCategory',updateCategory)
router.put('/UpdateNurses/:id',updateNurses)
router.put('/UpdatePatient/:id',updatePatient)
router.put('/UpdateRequest/:id',updateRequest)

export default router