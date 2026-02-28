import { Router } from "express";
import { prisma } from "../../../lib/prisma.js";
import { asyncWrapper } from "../../../utils/asyncWrapper.js";
import { AppError } from "../../../utils/AppError.js";
import { userAuth } from "../../../middleware/auth.js";
import { roleGuard } from "../../../middleware/roleGuard.js";
import { validate } from "../../../middleware/validate.js";
import { updateAvailabilitySchema } from "../technician.schemas.js";

export const techAvailabilityRouter = Router();

techAvailabilityRouter.use(userAuth, roleGuard("technician"));

// ─── PATCH /tech/availability ───────────────────────────────────
techAvailabilityRouter.patch(
  "/",
  validate(updateAvailabilitySchema),
  asyncWrapper(async (req, res) => {
    const { is_online } = req.body;

    const profile = await prisma.technicianProfile.findUnique({
      where: { user_id: req.userId },
    });
    if (!profile) throw new AppError("Technician profile not found", 404);

    // Cannot go offline during an active job
    if (!is_online) {
      const activeJob = await prisma.job.findFirst({
        where: {
          technician_id: profile.technician_id,
          status: { in: ["assigned", "in_progress"] },
          deleted_at: null,
        },
      });

      if (activeJob) {
        throw new AppError(
          "Cannot go offline while you have an active job",
          400
        );
      }
    }

    const updated = await prisma.technicianProfile.update({
      where: { technician_id: profile.technician_id },
      data: { is_online },
      select: { technician_id: true, is_online: true },
    });

    res.json({
      message: `You are now ${is_online ? "online" : "offline"}`,
      availability: updated,
    });
  })
);
