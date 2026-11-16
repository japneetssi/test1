import { Router } from 'express';
import { CalculatorController } from '../controllers/calculator.controller';
import { validateRequest } from '../middleware/validation.middleware';
import {
    sipSchema,
    emiSchema,
    retirementSchema,
    lifeInsuranceSchema,
    educationSchema,
    costOfDelaySchema,
    hraSchema,
    homeAffordabilitySchema,
    cagrSchema
} from '../validation/calculator.validation';

const router = Router();

// Core
router.post('/sip', validateRequest(sipSchema), CalculatorController.calculateSIP);
router.post('/emi', validateRequest(emiSchema), CalculatorController.calculateEMI);
router.post('/retirement', validateRequest(retirementSchema), CalculatorController.calculateRetirement);

// New Suite
router.post('/life-insurance', validateRequest(lifeInsuranceSchema), CalculatorController.calculateLifeInsurance);
router.post('/education', validateRequest(educationSchema), CalculatorController.calculateEducation);
router.post('/cost-of-delay', validateRequest(costOfDelaySchema), CalculatorController.calculateCostOfDelay);
router.post('/hra', validateRequest(hraSchema), CalculatorController.calculateHRA);
router.post('/home-affordability', validateRequest(homeAffordabilitySchema), CalculatorController.calculateHomeAffordability);
router.post('/cagr', validateRequest(cagrSchema), CalculatorController.calculateCAGR);

export default router;
