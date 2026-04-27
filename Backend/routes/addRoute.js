import express from 'express'
import { addCategory, addFeedback, addNurses,addPatients,addRequest } from '../controllers/addServices.js'


const router= express.Router()


router.post('/addCategory', addCategory)
router.post('/addNurses', addNurses)
router.post('/addPatients', addPatients)
router.post('/addRequest', addRequest)
router.post('/addFeedback', addFeedback)


export default router

