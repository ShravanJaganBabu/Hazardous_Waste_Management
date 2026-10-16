import { Shipment, IShipment, IRiskFactor } from '../models/Shipment.js';
import { Waste } from '../models/Waste.js';
import { Investigation } from '../models/Investigation.js';
import { Alert } from '../models/Alert.js';
import { createNotification } from './notificationService.js';
import { logAudit } from './auditService.js';
import { User } from '../models/User.js';

export class MonitoringEngine {
  /**
   * Pillar 3: Calculates dynamic risk score (0-100) and breakdown factors for a shipment.
   */
  public static async computeRiskScore(shipment: IShipment): Promise<{ score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; factors: IRiskFactor[] }> {
    let score = 10; // Baseline score
    const factors: IRiskFactor[] = [];

    // 1. Hazard Level
    const waste = await Waste.findOne({ wasteId: shipment.wasteId });
    if (waste) {
      if (waste.hazardLevel === 'HIGH' || waste.hazardLevel === 'EXTREME') {
        score += 30;
        factors.push({ factor: 'High/Extreme Chemical Hazard Classification', points: 30 });
      } else if (waste.hazardLevel === 'MEDIUM') {
        score += 15;
        factors.push({ factor: 'Moderate Chemical Hazard Classification', points: 15 });
      }
    }

    // 2. Quantity Mismatch
    if (shipment.discrepancy?.hasMismatch) {
      score += 25;
      factors.push({ factor: 'Quantity/Mass Balance Discrepancy Detected', points: 25 });
    }

    // 3. Transit Delay
    const now = new Date();
    if (shipment.status === 'IN_TRANSIT' && shipment.expectedDeliveryTime && now > shipment.expectedDeliveryTime) {
      score += 15;
      factors.push({ factor: 'Active Transportation Schedule Overdue', points: 15 });
    }

    // 4. Route Deviation
    if (shipment.routeTracking?.isDeviated) {
      score += 18;
      factors.push({ factor: `Corridor Breach: ${shipment.routeTracking.deviationDistanceKm || 4.2} km outside route`, points: 18 });
    }

    // 5. Missing / Under Review Documents
    if (!shipment.qrCode || !shipment.manifestNumber) {
      score += 12;
      factors.push({ factor: 'Missing / Incomplete Digital Manifest Verification', points: 12 });
    }

    // Clamp score to 100
    score = Math.min(100, score);

    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (score >= 80) level = 'CRITICAL';
    else if (score >= 60) level = 'HIGH';
    else if (score >= 35) level = 'MEDIUM';

    shipment.riskScore = score;
    shipment.riskLevel = level;
    shipment.riskFactors = factors;

    return { score, level, factors };
  }

  /**
   * Evaluates mass balance and quantity discrepancies for a shipment.
   */
  public static async evaluateQuantityMismatch(
    shipment: IShipment,
    actor: { userId: string; name: string; role: string }
  ): Promise<void> {
    const declared = shipment.declaredQuantity;
    const collected = shipment.collectedQuantity ?? declared;
    const received = shipment.receivedQuantity ?? collected;
    const treated = shipment.treatedQuantity ?? received;
    const disposed = shipment.disposedQuantity ?? treated;

    const labToTransporterDiff = Number((collected - declared).toFixed(2));
    const transporterToFacilityDiff = Number((received - collected).toFixed(2));
    const totalDiff = Number((received - declared).toFixed(2));
    const overallDiff = Number((disposed - declared).toFixed(2));

    const hasSignificantMismatch = Math.abs(totalDiff) >= 0.5 || Math.abs(labToTransporterDiff) >= 0.5 || Math.abs(transporterToFacilityDiff) >= 0.5;

    shipment.discrepancy = {
      labToTransporterDiff,
      transporterToFacilityDiff,
      totalDiff,
      hasMismatch: hasSignificantMismatch,
      mismatchReason: hasSignificantMismatch
        ? `Mass imbalance detected: Declared ${declared} ${shipment.unit}, Collected ${collected} ${shipment.unit}, Received ${received} ${shipment.unit} (Variance: ${totalDiff > 0 ? '+' : ''}${totalDiff} ${shipment.unit})`
        : undefined,
    };

    // Update quantity chain
    shipment.quantityChain = {
      declared,
      collected,
      received,
      treated,
      disposed,
      totalDifference: overallDiff,
      stageRecords: shipment.quantityChain?.stageRecords || [
        {
          stage: 'DECLARED',
          quantity: declared,
          unit: shipment.unit,
          verifiedBy: shipment.originOrganization.id,
          verifierName: shipment.originOrganization.name,
          timestamp: shipment.createdAt || new Date(),
          deltaExplanation: 'Initial waste generator declaration',
        },
      ],
    };

    // Recalculate dynamic risk score
    await this.computeRiskScore(shipment);
    await shipment.save();

    if (hasSignificantMismatch) {
      // Check if open investigation already exists
      const existingInvestigation = await Investigation.findOne({
        shipmentId: shipment.shipmentId,
        issueType: 'QUANTITY_MISMATCH',
        status: { $in: ['OPEN', 'UNDER_INVESTIGATION', 'AWAITING_RESPONSE', 'UNDER_REVIEW'] },
      });

      if (!existingInvestigation) {
        const investigationId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        let assignedUser = {
          userId: shipment.transporter.id,
          name: shipment.transporter.name,
          role: 'TRANSPORTER',
          organization: shipment.transporter.company,
        };

        if (Math.abs(transporterToFacilityDiff) > Math.abs(labToTransporterDiff)) {
          assignedUser = {
            userId: shipment.destinationFacility.id,
            name: shipment.destinationFacility.name,
            role: 'TREATMENT_FACILITY',
            organization: shipment.destinationFacility.name,
          };
        }

        await Investigation.create({
          investigationId,
          wasteId: shipment.wasteId,
          shipmentId: shipment.shipmentId,
          issueType: 'QUANTITY_MISMATCH',
          title: `Quantity Discrepancy (${totalDiff > 0 ? '+' : ''}${totalDiff} ${shipment.unit}) on ${shipment.shipmentId}`,
          description: `Automatic mass balance detection triggered. Declared: ${declared} ${shipment.unit}, Transporter Collected: ${collected} ${shipment.unit}, Facility Received: ${received} ${shipment.unit}. Immediate explanation and audit documentation requested.`,
          severity: 'CRITICAL',
          createdBy: {
            userId: 'SYSTEM',
            name: 'HazTrack Monitoring Engine',
            role: 'ADMIN',
          },
          assignedTo: assignedUser,
          status: 'AWAITING_RESPONSE',
          quantityComparison: {
            declaredQuantity: declared,
            collectedQuantity: collected,
            receivedQuantity: received,
            discrepancyAmount: totalDiff,
            unit: shipment.unit,
          },
          evidence: [],
          responses: [],
        });

        const differenceKg = Math.abs(totalDiff);
        const unitName = shipment.unit?.toLowerCase() === 'kg' ? 'kilogram' : shipment.unit;
        const voiceText = `Investigation request. The administrator requests an explanation for the ${differenceKg} ${unitName} difference between the dispatched and received quantities. Please review the details and submit your explanation.`;

        // Alert Admin with AI Voice prompt
        const adminUsers = await User.find({ role: 'ADMIN', status: 'ACTIVE' });
        for (const admin of adminUsers) {
          await createNotification({
            recipientUserId: admin.userId,
            recipientRole: 'ADMIN',
            shipmentId: shipment.shipmentId,
            wasteId: shipment.wasteId,
            type: 'QUANTITY_MISMATCH',
            severity: 'CRITICAL',
            title: `CRITICAL: Quantity Mismatch on Shipment ${shipment.shipmentId}`,
            message: `A quantity variance of ${totalDiff} ${shipment.unit} was recorded. Investigation ${investigationId} opened automatically.`,
            actionUrl: `/admin/investigations/${investigationId}`,
            voiceRequired: true,
            metadata: {
              investigationId,
              wasteId: shipment.wasteId,
              shipmentId: shipment.shipmentId,
              declaredQuantity: declared,
              collectedQuantity: collected,
              receivedQuantity: received,
              differenceKg,
              discrepancyAmount: totalDiff,
              unit: shipment.unit,
              assignedParty: assignedUser.name,
              assignedRole: assignedUser.role,
              assignedOrg: assignedUser.organization,
              voiceAnnouncement: voiceText,
            },
          });
        }

        // Alert Responsible Party
        await createNotification({
          recipientUserId: assignedUser.userId,
          recipientRole: assignedUser.role as any,
          shipmentId: shipment.shipmentId,
          wasteId: shipment.wasteId,
          type: 'INVESTIGATION_OPENED',
          severity: 'CRITICAL',
          title: `Investigation Request: Quantity Variance on ${shipment.shipmentId}`,
          message: `Discrepancy detected (${totalDiff} ${shipment.unit}). Please provide an explanation and verification manifests in the HazTrack investigation portal.`,
          actionUrl: `/admin/investigations/${investigationId}`,
          voiceRequired: true,
          metadata: {
            investigationId,
            wasteId: shipment.wasteId,
            shipmentId: shipment.shipmentId,
            declaredQuantity: declared,
            collectedQuantity: collected,
            receivedQuantity: received,
            differenceKg,
            discrepancyAmount: totalDiff,
            unit: shipment.unit,
            assignedParty: assignedUser.name,
            assignedRole: assignedUser.role,
            assignedOrg: assignedUser.organization,
            voiceAnnouncement: voiceText,
          },
        });

        await logAudit({
          actorUserId: actor.userId,
          actorName: actor.name,
          actorRole: actor.role,
          action: 'INVESTIGATION_AUTOMATICALLY_OPENED',
          entityType: 'INVESTIGATION',
          entityId: investigationId,
          description: `Smart Monitoring Engine opened investigation ${investigationId} due to ${totalDiff} ${shipment.unit} quantity variance.`,
        });
      }
    }
  }

  /**
   * Pillar 2 & 18: Full 11-anomaly detection engine and investigation escalation scheduler.
   */
  public static async runScheduledChecks(): Promise<void> {
    try {
      const now = new Date();

      // 1. Check for delayed shipments in transit
      const delayedShipments = await Shipment.find({
        status: 'IN_TRANSIT',
        expectedDeliveryTime: { $lt: now },
      });

      for (const shipment of delayedShipments) {
        // Prevent spamming duplicate delay alerts every 60 seconds
        const existingAlert = await Alert.findOne({
          shipmentId: shipment.shipmentId,
          type: 'TRANSIT_DELAY',
          createdAt: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) },
        });
        if (existingAlert) continue;

        const diffMs = now.getTime() - new Date(shipment.expectedDeliveryTime!).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const delayStr = `${diffHours}h ${diffMins}m`;

        await this.computeRiskScore(shipment);
        await shipment.save();

        await createNotification({
          recipientUserId: shipment.transporter.id,
          recipientRole: 'TRANSPORTER',
          shipmentId: shipment.shipmentId,
          wasteId: shipment.wasteId,
          type: 'TRANSIT_DELAY',
          severity: 'WARNING',
          title: `TRANSPORT DELAY: ${shipment.shipmentId}`,
          message: `Shipment ${shipment.shipmentId} delayed by ${delayStr}. Expected arrival was ${new Date(shipment.expectedDeliveryTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          actionUrl: `/transporter/shipments`,
          voiceRequired: true,
          metadata: {
            eventType: 'TRANSIT_DELAY',
            shipmentId: shipment.shipmentId,
          },
        });
      }

      // 2. Check for overdue pickups (collection requested > 24 hours ago)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const overduePickups = await Shipment.find({
        status: 'COLLECTION_REQUESTED',
        collectionRequestedTime: { $lt: oneDayAgo },
      });

      for (const shipment of overduePickups) {
        const existingPickupAlert = await Alert.findOne({
          shipmentId: shipment.shipmentId,
          type: 'PICKUP_OVERDUE',
          createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
        });
        if (existingPickupAlert) continue;

        await createNotification({
          recipientUserId: shipment.transporter.id,
          recipientRole: 'TRANSPORTER',
          shipmentId: shipment.shipmentId,
          wasteId: shipment.wasteId,
          type: 'PICKUP_OVERDUE',
          severity: 'WARNING',
          title: `Pending Pickup Overdue: ${shipment.shipmentId}`,
          message: `Waste pickup has been pending for over 24 hours at ${shipment.originOrganization.name}.`,
          actionUrl: `/transporter/dashboard`,
          voiceRequired: false,
        });
      }

      // 3. Pillar 18: Investigation Escalation Checks (response overdue > 2 hours)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const overdueInvestigations = await Investigation.find({
        status: 'AWAITING_RESPONSE',
        createdAt: { $lt: twoHoursAgo },
      });

      for (const inv of overdueInvestigations) {
        const existingEscalation = await Alert.findOne({
          shipmentId: inv.shipmentId,
          type: 'INVESTIGATION_OPENED',
          title: { $regex: 'ESCALATION' },
          createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
        });
        if (existingEscalation) continue;

        inv.status = 'UNDER_INVESTIGATION';
        await inv.save();

        const adminUsers = await User.find({ role: 'ADMIN', status: 'ACTIVE' });
        for (const admin of adminUsers) {
          await createNotification({
            recipientUserId: admin.userId,
            recipientRole: 'ADMIN',
            shipmentId: inv.shipmentId,
            wasteId: inv.wasteId,
            type: 'INVESTIGATION_OPENED',
            severity: 'CRITICAL',
            title: `ESCALATION: Investigation ${inv.investigationId} Response Overdue`,
            message: `Assigned party (${inv.assignedTo.name}) did not submit an explanation within the 2-hour window. Case escalated to Admin.`,
            actionUrl: `/admin/investigations/${inv.investigationId}`,
            voiceRequired: true,
          });
        }
      }
    } catch (err) {
      console.error('[MONITORING ENGINE ERROR]', err);
    }
  }
}
