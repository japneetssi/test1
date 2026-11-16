import { FamilyModel, Family } from '../models/family.model';
import { UserModel } from '../models/user.model';
import { PortfolioHoldingModel } from '../models/portfolioHolding.model';
import { PortfolioService } from './portfolio.service';
import { computePortfolioAnalytics } from './portfolioAnalytics.service';
import { HoldingInput, PortfolioAnalyticsResult } from '../types/portfolioAnalytics';
import logger from '../config/logger';

export class FamilyService {
    /**
     * Create a new family and set the creator as head.
     * partnerId may be null for B2C retail users (audit #19).
     */
    static async createFamily(name: string, headUserId: string, partnerId: string | null): Promise<Family> {
        const family = await FamilyModel.create(name, headUserId, partnerId);
        await FamilyModel.updateMemberFamily(headUserId, family.id);

        logger.info(`Family created: ${name} by user ${headUserId}${partnerId ? ` for partner ${partnerId}` : ' (personal/B2C)'}`);
        return family;
    }

    /**
     * Add a member to a family by email
     */
    static async addMemberByEmail(familyId: string, email: string, partnerId?: string): Promise<{ success: boolean; message: string }> {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            return { success: false, message: 'User not found with this email. Please ask them to sign up first.' };
        }

        // Multi-tenant check: User must belong to the same partner as the family
        if (partnerId && user.partner_id !== partnerId) {
            return { 
                success: false, 
                message: 'Cross-firm family members are not allowed. User belongs to a different partner.' 
            };
        }

        if (user.family_id) {
            return { success: false, message: 'User is already part of a family' };
        }

        await FamilyModel.updateMemberFamily(user.id, familyId);
        logger.info(`User ${user.id} added to family ${familyId}`);
        
        return { success: true, message: `Added ${user.full_name} to the family` };
    }

    /**
     * Remove a member from a family
     */
    static async removeMember(userId: string): Promise<void> {
        await FamilyModel.updateMemberFamily(userId, null);
    }

    /**
     * Get consolidated portfolio analytics for the entire family
     */
    static async getConsolidatedAnalytics(familyId: string): Promise<PortfolioAnalyticsResult> {
        const members = await FamilyModel.getMembers(familyId);
        const memberIds = members.map(member => member.id);

        // Fetch all holdings for all family members in one query
        const allHoldings = await PortfolioHoldingModel.findByMultipleUserIdsWithMetadata(memberIds);

        // Transform holdings to analytics input
        const allHoldingInputs: HoldingInput[] = allHoldings.map(h => ({
            isin: h.isin,
            quantity: h.quantity || 0,
            average_price: h.average_price,
            last_valuation: h.last_valuation,
            name: h.name,
            type: h.type as 'EQUITY' | 'MUTUAL_FUND',
            category: h.category || 'Uncategorized',
            current_nav: h.current_nav
        }));

        // Merge duplicate ISINs across family members for a clean view
        const mergedMap = new Map<string, HoldingInput>();
        allHoldingInputs.forEach(input => {
            const existing = mergedMap.get(input.isin);
            if (existing) {
                existing.quantity += input.quantity;
                if (existing.last_valuation !== undefined && input.last_valuation !== undefined) {
                    existing.last_valuation += input.last_valuation;
                }
                // Weighted average for price if both have it
                if (existing.average_price && input.average_price) {
                    const totalQty = existing.quantity + input.quantity;
                    existing.average_price = (existing.average_price * (existing.quantity - input.quantity) + input.average_price * input.quantity) / totalQty;
                }
            } else {
                mergedMap.set(input.isin, { ...input });
            }
        });

        const analytics = computePortfolioAnalytics(Array.from(mergedMap.values()));

        logger.info(`Computed consolidated analytics for family ${familyId}`, {
            membersCount: members.length,
            totalValue: analytics.totalValue
        });

        return analytics;
    }

    /**
     * Get all raw holdings for the family (with owner names)
     */
    static async getFamilyHoldings(familyId: string): Promise<any[]> {
        const members = await FamilyModel.getMembers(familyId);
        const allHoldings: any[] = [];

        for (const member of members) {
            const holdings = await PortfolioService.getHoldings(member.id);
            allHoldings.push(...holdings.map(h => ({ 
                ...h, 
                owner_name: member.full_name 
            })));
        }

        return allHoldings;
    }

    /**
     * Get family details including members and their individual net worths (for the head)
     */
    static async getFamilyDetails(familyId: string): Promise<any> {
        const family = await FamilyModel.findById(familyId);
        if (!family) throw new Error('Family not found');

        const members = await FamilyModel.getMembers(familyId);
        const membersWithNetWorth = await Promise.all(members.map(async m => {
            const portfolioSummary = await PortfolioService.getPortfolioSummary(m.id);
            return {
                ...m,
                netWorth: portfolioSummary.totalValuation
            };
        }));

        return {
            ...family,
            members: membersWithNetWorth
        };
    }
}
