import { Router } from "express";
import { PrismaClient } from "../../prisma-client";
import type {
  CreatePatternRequest,
  UpdatePatternRequest,
  PatternResponse,
  GenerateInstanceRequest,
  NthWeekdayConfig,
  YearlyConfig,
  YearlyNthWeekdayConfig,
  FrequencyType,
} from "../types";
import { getPeriodKey } from "../services/periodKeyService";
import {
  generateInstanceForPeriod,
  generateInstanceForCurrentPeriod,
} from "../services/recurrenceService";

const router = Router();
const prisma = new PrismaClient();

/**
 * Map database pattern to API response
 */
function mapPatternToResponse(pattern: any): PatternResponse {
  return {
    id: pattern.id,
    title: pattern.title,
    frequency: pattern.frequency,
    frequencyValue: pattern.frequencyValue,
    durationMinutes: pattern.durationMinutes,
    nthWeekdayConfig: pattern.nthWeekdayConfig as NthWeekdayConfig | null,
    yearlyConfig: pattern.yearlyConfig as YearlyConfig | null,
    yearlyNthWeekday: pattern.yearlyNthWeekday as YearlyNthWeekdayConfig | null,
    flexibleScheduling: pattern.flexibleScheduling,
    startTime: pattern.startTime,
    active: pattern.active,
    createdAt: pattern.createdAt,
    updatedAt: pattern.updatedAt,
  };
}

/**
 * Validate pattern configuration based on frequency type
 */
function validatePatternConfig(
  frequency: FrequencyType,
  config: CreatePatternRequest
): string | null {
  switch (frequency) {
    case "weekly":
      // Weekly patterns just need frequencyValue (not really used, but we'll set to 1)
      if (config.frequencyValue !== 1) {
        return "Weekly patterns must have frequencyValue = 1";
      }
      break;

    case "monthly":
      // Monthly patterns just need frequencyValue = 1
      if (config.frequencyValue !== 1) {
        return "Monthly patterns must have frequencyValue = 1";
      }
      break;

    case "yearly":
      // Yearly patterns require yearlyConfig
      if (!config.yearlyConfig) {
        return "Yearly patterns require yearlyConfig (month and day)";
      }
      if (config.yearlyConfig.month < 1 || config.yearlyConfig.month > 12) {
        return "Month must be between 1 and 12";
      }
      if (config.yearlyConfig.day < 1 || config.yearlyConfig.day > 31) {
        return "Day must be between 1 and 31";
      }
      break;

    case "every_n_days":
      // Every N days requires frequencyValue > 0
      if (config.frequencyValue < 1) {
        return "every_n_days patterns must have frequencyValue >= 1";
      }
      break;

    case "n_per_period":
      // N per period requires frequencyValue > 0
      if (config.frequencyValue < 1) {
        return "n_per_period patterns must have frequencyValue >= 1";
      }
      break;

    case "nth_weekday_of_month":
      // Nth weekday of month requires nthWeekdayConfig
      if (!config.nthWeekdayConfig) {
        return "nth_weekday_of_month patterns require nthWeekdayConfig";
      }
      if (
        config.nthWeekdayConfig.weekday < 0 ||
        config.nthWeekdayConfig.weekday > 6
      ) {
        return "Weekday must be between 0 (Sunday) and 6 (Saturday)";
      }
      if (
        config.nthWeekdayConfig.occurrence < 1 ||
        (config.nthWeekdayConfig.occurrence > 4 &&
          config.nthWeekdayConfig.occurrence !== -1)
      ) {
        return "Occurrence must be 1-4 or -1 (last)";
      }
      break;

    default:
      return `Unknown frequency type: ${frequency}`;
  }

  return null; // Valid
}

// GET /api/patterns - Get all patterns
router.get("/", async (req, res) => {
  try {
    const { active } = req.query;

    const where: any = {};
    if (active !== undefined) {
      where.active = active === "true";
    }

    const patterns = await prisma.recurrencePattern.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    const response: PatternResponse[] = patterns.map(mapPatternToResponse);

    res.json(response);
  } catch (error) {
    console.error("Error fetching patterns:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/patterns/:id - Get a single pattern
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const pattern = await prisma.recurrencePattern.findUnique({
      where: { id },
    });

    if (!pattern) {
      return res.status(404).json({ error: "Pattern not found" });
    }

    res.json(mapPatternToResponse(pattern));
  } catch (error) {
    console.error("Error fetching pattern:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/patterns - Create a new pattern
router.post("/", async (req, res) => {
  try {
    const {
      title,
      frequency,
      frequencyValue,
      durationMinutes,
      nthWeekdayConfig,
      yearlyConfig,
      yearlyNthWeekday,
      flexibleScheduling,
      startTime,
    } = req.body as CreatePatternRequest;

    // Basic validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!frequency) {
      return res.status(400).json({ error: "Frequency is required" });
    }

    if (durationMinutes === undefined || durationMinutes <= 0) {
      return res.status(400).json({ error: "Duration must be greater than 0" });
    }

    // Validate flexible scheduling and startTime relationship
    const isFlexible = flexibleScheduling ?? true; // Default to true
    if (!isFlexible && !startTime) {
      return res.status(400).json({
        error: "startTime is required when flexibleScheduling is false",
      });
    }

    if (isFlexible && startTime) {
      return res.status(400).json({
        error: "startTime must be null when flexibleScheduling is true",
      });
    }

    // Validate pattern configuration
    const validationError = validatePatternConfig(frequency, req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Create the pattern
    const pattern = await prisma.recurrencePattern.create({
      data: {
        title: title.trim(),
        frequency,
        frequencyValue,
        durationMinutes,
        nthWeekdayConfig: nthWeekdayConfig || null,
        yearlyConfig: yearlyConfig || null,
        yearlyNthWeekday: yearlyNthWeekday || null,
        flexibleScheduling: isFlexible,
        startTime: startTime ? new Date(startTime) : null,
      },
    });

    res.status(201).json(mapPatternToResponse(pattern));
  } catch (error) {
    console.error("Error creating pattern:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/patterns/:id - Update a pattern
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body as UpdatePatternRequest;

    // Verify pattern exists
    const existingPattern = await prisma.recurrencePattern.findUnique({
      where: { id },
    });

    if (!existingPattern) {
      return res.status(404).json({ error: "Pattern not found" });
    }

    // Build update data object (only allow title, duration, and active per spec)
    const updateData: any = {};

    if (updates.title !== undefined) {
      if (updates.title.trim().length === 0) {
        return res.status(400).json({ error: "Title cannot be empty" });
      }
      updateData.title = updates.title.trim();
    }

    if (updates.durationMinutes !== undefined) {
      if (updates.durationMinutes <= 0) {
        return res
          .status(400)
          .json({ error: "Duration must be greater than 0" });
      }
      updateData.durationMinutes = updates.durationMinutes;
    }

    if (updates.active !== undefined) {
      updateData.active = updates.active;
    }

    // Update the pattern
    const updatedPattern = await prisma.recurrencePattern.update({
      where: { id },
      data: updateData,
    });

    res.json(mapPatternToResponse(updatedPattern));
  } catch (error) {
    console.error("Error updating pattern:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/patterns/:id - Soft delete (deactivate) a pattern
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verify pattern exists
    const existingPattern = await prisma.recurrencePattern.findUnique({
      where: { id },
    });

    if (!existingPattern) {
      return res.status(404).json({ error: "Pattern not found" });
    }

    // Soft delete by setting active = false
    await prisma.recurrencePattern.update({
      where: { id },
      data: { active: false },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting pattern:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/patterns/:id/generate-instance - Generate an instance for a pattern
router.post("/:id/generate-instance", async (req, res) => {
  try {
    const { id } = req.params;
    const { periodKey } = req.body as GenerateInstanceRequest;

    // Verify pattern exists
    const pattern = await prisma.recurrencePattern.findUnique({
      where: { id },
    });

    if (!pattern) {
      return res.status(404).json({ error: "Pattern not found" });
    }

    if (!pattern.active) {
      return res.status(400).json({ error: "Pattern is not active" });
    }

    // Generate instance
    let event;
    if (periodKey) {
      // Use provided period key
      event = await generateInstanceForPeriod(pattern as any, periodKey);
    } else {
      // Use current period
      event = await generateInstanceForCurrentPeriod(id);
    }

    if (!event) {
      return res
        .status(409)
        .json({ error: "Pattern already satisfied for this period" });
    }

    res.status(201).json(event);
  } catch (error) {
    console.error("Error generating instance:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
